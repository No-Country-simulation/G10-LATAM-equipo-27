"""Tests de la transformacion mensaje de Discord -> Interaccion."""

from app.transform import mensaje_a_interaccion


def _mensaje_base(**overrides):
    base = {
        "id": "100",
        "content": "Hola comunidad!",
        "timestamp": "2026-09-20T10:00:00.000000+00:00",
        "author": {"id": "1", "username": "mariana", "global_name": "Mariana Souza", "bot": False},
        "attachments": [],
        "reactions": [],
        "message_reference": None,
    }
    base.update(overrides)
    return base


def test_mensaje_normal_se_transforma():
    interaccion = mensaje_a_interaccion(_mensaje_base(), canal_nombre="logros-y-empleos")

    assert interaccion is not None
    assert interaccion.id == "100"
    assert interaccion.autor == "Mariana Souza"
    assert interaccion.canal == "#logros-y-empleos"
    assert interaccion.texto == "Hola comunidad!"
    assert interaccion.tipo == "sin_clasificar"
    assert interaccion.respuesta_a is None


def test_usa_apodo_del_servidor_si_existe():
    mensaje = _mensaje_base(member={"nick": "Mari"})
    interaccion = mensaje_a_interaccion(mensaje, canal_nombre="general")
    assert interaccion.autor == "Mari"


def test_descarta_mensajes_de_bots_reales():
    mensaje = _mensaje_base(author={"id": "2", "username": "bot", "bot": True})
    assert mensaje_a_interaccion(mensaje, canal_nombre="general") is None


def test_acepta_mensajes_de_webhook_aunque_bot_sea_true():
    # Scripts de prueba (o integraciones como n8n) publican como webhook y
    # Discord marca esos mensajes con bot=True; deben tratarse como
    # contenido normal de la comunidad, no descartarse.
    mensaje = _mensaje_base(
        author={"id": "2", "username": "Lucas Albuquerque", "bot": True},
        webhook_id="999",
    )
    interaccion = mensaje_a_interaccion(mensaje, canal_nombre="preguntas")
    assert interaccion is not None
    assert interaccion.autor == "Lucas Albuquerque"


def test_descarta_mensajes_sin_texto():
    mensaje = _mensaje_base(content="   ")
    assert mensaje_a_interaccion(mensaje, canal_nombre="general") is None


def test_cuenta_reacciones_y_adjuntos():
    mensaje = _mensaje_base(
        reactions=[{"count": 3}, {"count": 2}],
        attachments=[{"url": "https://cdn.discord.com/a.png"}],
    )
    interaccion = mensaje_a_interaccion(mensaje, canal_nombre="general")
    assert interaccion.reacciones == 5
    assert interaccion.adjuntos == ["https://cdn.discord.com/a.png"]


def test_marca_respuesta_a_otro_mensaje():
    mensaje = _mensaje_base(message_reference={"message_id": "99"})
    interaccion = mensaje_a_interaccion(mensaje, canal_nombre="general")
    assert interaccion.respuesta_a == "99"
