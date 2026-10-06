import pytest
from streamlit.testing.v1 import AppTest
from unittest.mock import patch
import datetime

def test_date_inputs_exist_and_empty():
    at = AppTest.from_file("app.py", default_timeout=10)
    at.run()
    
    # Tarea 2: selectores existen y empiezan vacíos
    assert len(at.date_input) >= 2, "Deberían haber al menos 2 date_input"
    assert at.date_input[0].value is None, "Desde debe iniciar en None"
    assert at.date_input[1].value is None, "Hasta debe iniciar en None"

@patch('ver_json.obtener_json')
def test_inverted_dates_validation(mock_obtener_json):
    mock_obtener_json.return_value = {"total": 10, "interacciones": [{}]*10}
    at = AppTest.from_file("app.py", default_timeout=10).run()
    
    # Simular fechas invertidas
    at.date_input[0].set_value(datetime.date(2023, 10, 10))
    at.date_input[1].set_value(datetime.date(2023, 10, 5))
    at.run()
    
    # Tarea 3: validar st.error cuando desde > hasta
    assert at.error, "Debería mostrarse un error si la fecha Desde es mayor a Hasta"
    assert "error" in at.error[0].value.lower() or "mayor" in at.error[0].value.lower()

@patch('ver_json.obtener_json')
def test_empty_range_validation(mock_obtener_json):
    # Simular base de datos vacía para esas fechas
    mock_obtener_json.return_value = {"total": 0, "interacciones": []}
    at = AppTest.from_file("app.py", default_timeout=10).run()
    
    at.date_input[0].set_value(datetime.date(2023, 10, 1))
    at.date_input[1].set_value(datetime.date(2023, 10, 5))
    at.run()
    
    # Tarea 5: validar st.warning cuando el total es 0
    assert at.warning, "Debería mostrarse un warning si no hay mensajes en ese rango"
    # El botón debería estar deshabilitado
    assert at.button[1].disabled == True, "El botón 'Ejecutar Análisis' debe estar deshabilitado si no hay mensajes"

@patch('ver_json.obtener_json')
def test_parameters_passed_to_obtener_json(mock_obtener_json):
    mock_obtener_json.return_value = {"total": 5, "interacciones": [{}]*5}
    at = AppTest.from_file("app.py", default_timeout=10).run()
    
    d1 = datetime.date(2023, 10, 1)
    d2 = datetime.date(2023, 10, 10)
    at.date_input[0].set_value(d1)
    at.date_input[1].set_value(d2)
    at.run()
    
    # Tarea 4: pasar fechas a obtener_json
    mock_obtener_json.assert_called_with(desde=d1, hasta=d2)

@patch('ver_json.obtener_json')
def test_counter_updates_with_filters(mock_obtener_json):
    def side_effect(desde=None, hasta=None):
        if desde is not None or hasta is not None:
            return {"total": 5, "interacciones": [{}]*5}
        return {"total": 20, "interacciones": [{}]*20}
    
    mock_obtener_json.side_effect = side_effect
    
    at = AppTest.from_file("app.py", default_timeout=10).run()
    
    # Verificar que el contador inicial muestra 20
    info_texts_initial = [info.value for info in at.info]
    assert any("20" in text for text in info_texts_initial), "El contador no muestra 20 inicialmente"
    
    # Simular filtros
    at.date_input[0].set_value(datetime.date(2023, 10, 1))
    at.date_input[1].set_value(datetime.date(2023, 10, 10))
    at.run()
    
    # Comprobar que el st.info del contador se actualiza a 5
    info_texts = [info.value for info in at.info]
    found = any("5" in text and "mensajes" in text.lower() for text in info_texts)
    assert found, "El contador no se actualizó para reflejar la cantidad filtrada (5)."


