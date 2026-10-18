from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True


def test_text_prediction_success():
    response = client.post(
        "/api/predict",
        json={
            "mode": "text",
            "input": (
                "Scientists report that the Earth revolves around the Sun. "
                "Repeated astronomical observations support this conclusion."
            ),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "text"
    assert data["prediction"] in ["fake", "real"]
    assert data["verdict"] in ["Likely Fake News", "Likely Real News"]
    assert 0 <= data["confidence"] <= 100
    assert "signals" in data
    assert "model_note" in data


def test_short_text_is_rejected():
    response = client.post(
        "/api/predict",
        json={"mode": "text", "input": "Too short"},
    )

    assert response.status_code == 422
    assert "30 characters" in response.json()["detail"]


def test_blank_text_is_rejected():
    response = client.post(
        "/api/predict",
        json={"mode": "text", "input": "   "},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Please enter article text or a URL."
    )


def test_invalid_mode_is_rejected():
    response = client.post(
        "/api/predict",
        json={"mode": "invalid", "input": "This is a sufficiently long test input."},
    )

    assert response.status_code == 422
