"""Health endpoint tests."""

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["status"] == "ok"
    assert body["data"]["service"] == "restaurantos-api"
    assert "X-Request-ID" in response.headers


def test_api_v1_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ok"


@patch("app.api.v1.health.check_database_connection", new_callable=AsyncMock)
def test_ready_when_database_up(mock_db_check: AsyncMock, client: TestClient) -> None:
    mock_db_check.return_value = True
    response = client.get("/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["status"] == "ready"
    assert body["data"]["checks"]["database"] is True


@patch("app.api.v1.health.check_database_connection", new_callable=AsyncMock)
def test_ready_when_database_down(mock_db_check: AsyncMock, client: TestClient) -> None:
    mock_db_check.return_value = False
    response = client.get("/ready")
    assert response.status_code == 503
    body = response.json()
    assert body["data"]["status"] == "not_ready"
