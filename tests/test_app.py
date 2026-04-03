import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

# Arrange-Act-Assert pattern is used in all tests

def test_get_activities():
    # Arrange: 何も必要なし
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "Programming Class" in data

def test_signup_success():
    # Arrange
    email = "testuser1@mergington.edu"
    activity = "Math Olympiad"
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 200
    assert f"Signed up {email} for {activity}" in response.json().get("message", "")
    # 後片付け: 参加解除
    client.delete(f"/activities/{activity}/signup?email={email}")

def test_signup_duplicate():
    # Arrange
    email = "testuser2@mergington.edu"
    activity = "Math Olympiad"
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 400
    assert "already signed up" in response.json().get("detail", "")
    # 後片付け
    client.delete(f"/activities/{activity}/signup?email={email}")

def test_signup_activity_not_found():
    # Arrange
    email = "testuser3@mergington.edu"
    activity = "Nonexistent Activity"
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 404
    assert "Activity not found" in response.json().get("detail", "")

def test_unregister_success():
    # Arrange
    email = "testuser4@mergington.edu"
    activity = "Math Olympiad"
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.delete(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 200
    # もう一度解除するとエラー
    response2 = client.delete(f"/activities/{activity}/signup?email={email}")
    assert response2.status_code == 400 or response2.status_code == 404

def test_signup_full():
    # Arrange
    activity = "Math Olympiad"
    # 参加枠を埋める
    max_participants = 18
    emails = [f"fulltest{i}@mergington.edu" for i in range(max_participants)]
    for email in emails:
        client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.post(f"/activities/{activity}/signup?email=overflow@mergington.edu")
    # Assert
    assert response.status_code == 400
    assert "Activity is full" in response.json().get("detail", "")
    # 後片付け
    for email in emails:
        client.delete(f"/activities/{activity}/signup?email={email}")
