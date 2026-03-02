from copy import deepcopy
import pytest

from src import app
from fastapi.testclient import TestClient

# keep a snapshot of the original in-memory data so tests are independent
_original_activities = deepcopy(app.activities)


def setup_function(function):
    # restore the activities dict before each test
    app.activities.clear()
    app.activities.update(deepcopy(_original_activities))


def test_get_activities():
    client = TestClient(app.app)
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"], dict)


def test_signup_and_duplicate():
    client = TestClient(app.app)
    email = "new@mergington.edu"
    # ensure email not already present
    assert email not in app.activities["Chess Club"]["participants"]

    # sign up once
    resp1 = client.post(
        "/activities/Chess Club/signup",
        params={"email": email},
    )
    assert resp1.status_code == 200
    assert email in app.activities["Chess Club"]["participants"]

    # signing up again should fail
    resp2 = client.post(
        "/activities/Chess Club/signup",
        params={"email": email},
    )
    assert resp2.status_code == 400


def test_unregister():
    client = TestClient(app.app)
    email = "unreg@mergington.edu"
    # add then remove
    resp_signup = client.post(
        "/activities/Gym Class/signup",
        params={"email": email},
    )
    assert resp_signup.status_code == 200
    assert email in app.activities["Gym Class"]["participants"]

    resp_del = client.delete(
        "/activities/Gym Class/signup",
        params={"email": email},
    )
    assert resp_del.status_code == 200
    assert email not in app.activities["Gym Class"]["participants"]


@pytest.mark.parametrize("act", ["Nonexistent", "Invalid Activity"])
def test_signup_nonexistent_activity(act):
    client = TestClient(app.app)
    resp = client.post(
        f"/activities/{act}/signup",
        params={"email": "foo@bar.com"},
    )
    assert resp.status_code == 404
