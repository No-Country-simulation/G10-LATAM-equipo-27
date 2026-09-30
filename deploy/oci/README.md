# Despliegue en OCI (Always Free)

Guía paso a paso para desplegar `services/discord_extractor` en una VM Compute
Always Free de Oracle Cloud Infrastructure, con el paquete generado persistido
en un bucket de Object Storage. Todo se mantiene dentro de la capa **Always
Free**.

> ✅ **Verificado end-to-end** (2026-09-30): despliegue real en una
> `VM.Standard.E2.1.Micro` en la región Santiago (`sa-santiago-1`), con
> `POST /extract` capturando mensajes reales de Discord y subiéndolos al
> bucket vía Instance Principal.

## 0. Alerta de presupuesto (recomendado)

Antes de crear nada, conviene una alerta de gasto para dormir tranquilos:

1. **Cost Management → Budgets → Create Budget**.
2. Compartment: root. Monto: por ejemplo $1 (cualquier cargo real lo supera
   de inmediato).
3. Alert rule: Actual Spend, 100% del threshold, con el email del equipo.

Esto no evita cargos, pero avisa apenas aparece cualquiera sin tener que
revisar la tarjeta manualmente.

## 1. Bucket de Object Storage

1. Consola de OCI → **Storage → Buckets** → seleccionar el compartment del
   proyecto → **Create Bucket**.
2. Nombre: `communitylab-discord-raw`. Visibilidad: **Private** (por defecto).
   Storage Tier: **Standard** (no tocar Archive/Auto-Tiering). No hace falta
   cifrado con llave propia (usa la llave administrada por Oracle, incluida
   en Always Free).
3. Anotar el **namespace** de la cuenta (aparece en la página del bucket, o
   con `oci os ns get` desde Cloud Shell).

## 2. Crear la VM

1. Consola de OCI → **Compute → Instances** → **Create Instance**.
2. Shape Always Free recomendado: `VM.Standard.A1.Flex` (ARM, hasta 4 OCPU /
   24 GB en la capa gratuita) o, si no está disponible, `VM.Standard.E2.1.Micro`
   (x86, 1 OCPU / 1 GB).
3. Imagen: Ubuntu (LTS) u Oracle Linux, la que tenga el equipo más a mano
   (esta guía usa comandos de Oracle Linux/RHEL — `dnf`, `firewall-cmd`).
4. Networking: si reutilizas una VCN existente en vez de crear una nueva,
   ver la sección de **red** más abajo antes de continuar.
5. En **Add SSH keys**, deja que OCI genere el par de llaves y descarga la
   privada (no se puede volver a descargar después).
6. En **Show advanced options → Management**, si encuentras el campo de
   **Init script (cloud-init)**, pega el contenido de
   [`cloud-init.yaml`](./cloud-init.yaml) (instala Docker y Git
   automáticamente). Si no lo encuentras en la UI, no es bloqueante — se
   puede instalar todo a mano después (ver paso 5).
7. Crear la instancia y anotar su **IP pública** y su **OCID** (lo vamos a
   necesitar para el dynamic group).

> ⚠️ **Sin capacidad ("Out of capacity")**: es muy común que `A1.Flex` no
> tenga cupo disponible en regiones más chicas (por ejemplo Santiago, que
> tiene una sola availability domain). Si pasa, prueba con
> `VM.Standard.E2.1.Micro`; si ese tampoco tiene cupo, reintenta en otro
> momento del día — la capacidad Always Free fluctúa y no es un problema de
> configuración ni de límites de la cuenta.

## 3. Red: reutilizar una VCN existente

Si eliges "Select existing virtual cloud network" en vez de crear una nueva,
verifica que tenga lo necesario para salir a internet (una VCN nueva creada
desde el wizard de la instancia ya trae esto por defecto, pero una VCN vieja
de otro proyecto puede no tenerlo):

1. **Internet Gateway**: la VCN debe tener uno en estado *Available*.
2. **Route Table**: la tabla de rutas asociada a la subred pública debe
   tener una regla `0.0.0.0/0 → Internet Gateway`. Sin esta regla, la VM
   tiene IP pública pero es inalcanzable (los `TCP connect` dan *timeout*,
   no *connection refused* — esa combinación es la pista de que falta esta
   regla).

## 4. Abrir los puertos 22 y 8000

1. En la Security List de la VCN (**Networking → Virtual Cloud Networks →
   [tu VCN] → Security Lists**) → **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0` (o restringido a las IPs del equipo).
   - Protocolo: TCP, puerto de destino: `22` (SSH) y `8000` (la API) — una
     regla por puerto. Una VCN reutilizada de otro proyecto puede ya tener
     la regla de SSH; verifícalo en vez de asumir que está.
2. Dentro de la VM, si usa `firewalld` (Oracle Linux):
   ```bash
   sudo firewall-cmd --permanent --add-port=8000/tcp
   sudo firewall-cmd --reload
   ```

## 5. Instalar Docker (si el cloud-init no corrió)

En una `E2.1.Micro` (1 GB de RAM), instalar Docker vía `dnf` puede fallar
con `Killed` (el proceso se queda sin memoria) si no hay swap configurado.
Antes de instalar, agregar un swapfile:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Luego instalar Docker (Oracle Linux / RHEL):

```bash
sudo dnf install -y dnf-utils git
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker opc
newgrp docker
```

Si algún `dnf install` queda en *"Waiting for process with pid ... to
finish"*, es porque otro proceso (por ejemplo el timer automático de
actualización de caché) tiene el lock — solo hay que esperar, se libera
solo.

## 6. Dynamic Group + Policy (Instance Principal)

Esto permite que la API, corriendo dentro de la VM, escriba en el bucket
**sin usar ninguna API key** (usa la identidad de la propia instancia).

1. Obtener el OCID de la instancia (desde dentro de la VM, más simple que
   copiarlo de la consola):
   ```bash
   curl -s -H "Authorization: Bearer Oracle" -L http://169.254.169.254/opc/v2/instance/id
   ```
2. **Identity & Security → Dynamic Groups → Create Dynamic Group**.
   - Nombre: `communitylab-vm`.
   - Matching rule (con el OCID del paso anterior):
     ```
     instance.id = '<OCID_DE_LA_INSTANCIA>'
     ```
3. **Identity & Security → Policies → Create Policy**:
   ```
   Allow dynamic-group communitylab-vm to manage objects in tenancy where target.bucket.name='communitylab-discord-raw'
   ```
   > ⚠️ Si el bucket vive en el **compartment root** de la cuenta, se usa la
   > palabra clave `tenancy`, no el nombre del compartment — `in compartment
   > <nombre-del-root>` da error ("Compartment ... does not exist or is not
   > part of the policy compartment subtree"). `in tenancy` sí funciona.
   > Si el bucket está en un compartment normal (no root), ahí sí se usa
   > `in compartment <nombre-del-compartment>`.

## 7. Clonar el repo y construir la imagen en la VM

Conectarse por SSH y, dentro de `services/discord_extractor`:

```bash
git clone https://github.com/No-Country-simulation/G10-LATAM-equipo-27.git
cd G10-LATAM-equipo-27
git checkout feature/discord-extractor
cd services/discord_extractor

cp .env.example .env
nano .env
```

En el `.env`, completar **todos** estos campos (es fácil dejar alguno con
el valor de ejemplo sin querer — revisar dos veces antes de guardar):

```
API_KEY=<una clave de produccion, distinta a la de tu .env local>
DISCORD_BOT_TOKEN=<tu token del bot>
DISCORD_GUILD_ID=<tu guild id>
OCI_AUTH=instance_principal
OCI_NAMESPACE=<el namespace de la cuenta, ver paso 1>
OCI_BUCKET_NAME=communitylab-discord-raw
```

Build y run:

```bash
docker build -t discord-extractor .
docker run -d --name discord-extractor \
  --env-file .env \
  -p 8000:8000 \
  --restart unless-stopped \
  discord-extractor
```

> Se construye la imagen directamente en la VM (en vez de subirla a un
> registry) para evitar problemas de arquitectura entre la máquina de
> desarrollo (x86/ARM) y la VM. En una `E2.1.Micro` el build tarda varios
> minutos (~5), es esperable.

Si después hay que cambiar algo del `.env`, el contenedor no relee el
archivo solo — hay que recrearlo:

```bash
docker stop discord-extractor && docker rm discord-extractor
docker run -d --name discord-extractor --env-file .env -p 8000:8000 --restart unless-stopped discord-extractor
```

## 8. Verificar

Desde cualquier máquina con acceso a la IP pública:

```bash
curl http://<IP_PUBLICA>:8000/health
# {"status":"ok"}

curl -H "X-API-Key: <la que pusiste en .env>" http://<IP_PUBLICA>:8000/channels
```

Si `/channels` devuelve la lista de canales del servidor, el bot está bien
configurado. Prueba final, con subida real a OCI:

```bash
curl -X POST http://<IP_PUBLICA>:8000/extract \
  -H "X-API-Key: <la que pusiste en .env>" \
  -H "Content-Type: application/json" \
  -d '{"channel_ids": ["<un-channel-id>"], "periodo_referencia": "Semana_XX", "subir_a_oci": true}'
```

Una respuesta con `"almacenamiento_oci": {"status": "guardado_con_exito"}`
confirma que Instance Principal funciona. Se puede verificar el objeto
también en la consola (**Buckets → communitylab-discord-raw**) o con
`oci os object list --bucket-name communitylab-discord-raw --namespace
<namespace>` desde Cloud Shell.

## Notas de costos

- Mantener siempre shapes, storage y transferencia dentro de los límites
  Always Free (ver la consola de OCI → **Governance → Cost Management**, o el
  panel de "Always Free" en el dashboard principal).
- El bucket no tiene costo mientras el volumen de datos se mantenga dentro de
  los 20 GB combinados incluidos en Always Free.
- La IP pública de una VM Always Free es **efímera**: si se detiene y
  vuelve a encender la instancia, puede cambiar. Si el equipo necesita una
  IP fija, se puede reservar una IP pública (también Always Free) desde
  **Networking → IP Management → Reserved Public IPs**.
