def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_auth_permissions_and_task_workflow(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/api/v1/auth/me").status_code == 401

    admin_login = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "test-admin-password-123"})
    assert admin_login.status_code == 200
    admin = admin_login.json()
    admin_headers = bearer(admin["access_token"])

    roles = client.get("/api/v1/admin/roles", headers=admin_headers).json()
    assert {role["name"] for role in roles} == {"ADMIN", "MANAGER", "EMPLOYEE"}
    catalog = client.get("/api/v1/permissions", headers=admin_headers).json()
    permission_ids = {permission["key"]: permission["id"] for permission in catalog}

    manager_grants = [
        {"permission_id": permission_ids[key], "can_view": True, "can_create": True, "can_update": True, "can_delete": True}
        for key in ("dashboard", "employees", "employee_details", "tasks", "task_management", "daily_jobs")
    ]
    manager_response = client.post(
        "/api/v1/admin/managers",
        headers=admin_headers,
        json={
            "first_name": "Morgan",
            "last_name": "Manager",
            "email": "morgan.manager@example.com",
            "password": "manager-password-123",
            "permissions": manager_grants,
        },
    )
    assert manager_response.status_code == 201
    manager = manager_response.json()

    employee_grants = [
        {
            "permission_id": permission_ids[key],
            "can_view": True,
            "can_create": False,
            "can_update": key == "my_tasks",
            "can_delete": False,
        }
        for key in ("dashboard", "profile", "my_tasks", "daily_jobs", "task_history")
    ]
    employee_response = client.post(
        "/api/v1/admin/employees",
        headers=admin_headers,
        json={
            "first_name": "Riley",
            "last_name": "Employee",
            "email": "riley.employee@example.com",
            "password": "employee-password-123",
            "manager_id": manager["id"],
            "permissions": employee_grants,
        },
    )
    assert employee_response.status_code == 201
    employee = employee_response.json()

    second_employee_response = client.post(
        "/api/v1/admin/employees",
        headers=admin_headers,
        json={
            "first_name": "Taylor",
            "last_name": "Outside",
            "email": "outside.employee@example.com",
            "password": "employee-password-123",
            "permissions": employee_grants,
        },
    )
    assert second_employee_response.status_code == 201
    outside_employee = second_employee_response.json()

    manager_token = client.post(
        "/api/v1/auth/login",
        json={"email": manager["email"], "password": "manager-password-123"},
    ).json()["access_token"]
    employee_token = client.post(
        "/api/v1/auth/login",
        json={"email": employee["email"], "password": "employee-password-123"},
    ).json()["access_token"]
    manager_headers = bearer(manager_token)
    employee_headers = bearer(employee_token)

    manager_team = client.get("/api/v1/manager/employees", headers=manager_headers)
    assert manager_team.status_code == 200
    assert manager_team.json()["total"] == 1
    assert manager_team.json()["items"][0]["id"] == employee["id"]

    daily_job_response = client.post(
        "/api/v1/manager/daily-jobs",
        headers=manager_headers,
        json={"title": "Update customer records", "description": "Review today's customer updates.", "assigned_to": employee["id"], "priority": "HIGH"},
    )
    assert daily_job_response.status_code == 201
    daily_job = daily_job_response.json()
    assert daily_job["is_daily_job"] is True
    assert daily_job["assigned_by"] == manager["id"]

    employee_tasks = client.get("/api/v1/employee/tasks", headers=employee_headers)
    assert employee_tasks.status_code == 200
    assert employee_tasks.json()["total"] == 1

    other_task = client.post(
        "/api/v1/admin/tasks",
        headers=admin_headers,
        json={"title": "Private task", "assigned_to": outside_employee["id"], "priority": "LOW"},
    )
    assert other_task.status_code == 201
    assert client.get(f"/api/v1/employee/tasks/{other_task.json()['id']}", headers=employee_headers).status_code == 404
    assert client.get(f"/api/v1/manager/tasks/{other_task.json()['id']}", headers=manager_headers).status_code == 404

    task_id = daily_job["id"]
    admin_dashboard = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert admin_dashboard.status_code == 200
    assert len(admin_dashboard.json()["daily_tasks"]) == 7
    assert client.get("/api/v1/manager/dashboard", headers=manager_headers).status_code == 200
    assert client.get("/api/v1/employee/dashboard", headers=employee_headers).status_code == 200
    assert client.put(f"/api/v1/employee/tasks/{task_id}/start", headers=employee_headers).status_code == 200
    assert client.put(f"/api/v1/employee/tasks/{task_id}/complete", headers=employee_headers).status_code == 200
    assert client.put(f"/api/v1/employee/tasks/{task_id}/complete", headers=employee_headers).status_code == 409
    history = client.get("/api/v1/employee/tasks/history?status=COMPLETED", headers=employee_headers)
    assert history.status_code == 200
    assert history.json()["total"] == 1

    assert client.get("/api/v1/manager/tasks", headers=employee_headers).status_code == 403
    assert client.get("/api/v1/admin/dashboard", headers=employee_headers).status_code == 403

    # A one-time refresh token rotates, and the original token cannot be reused.
    refresh_token = admin["refresh_token"]
    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refreshed.status_code == 200
    assert refreshed.json()["refresh_token"] != refresh_token
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token}).status_code == 401

    custom_permission = client.post(
        "/api/v1/permissions",
        headers=admin_headers,
        json={"name": "Projects", "key": "projects", "description": "Project workspace access."},
    )
    assert custom_permission.status_code == 201
    assert client.delete(f"/api/v1/permissions/{custom_permission.json()['id']}", headers=admin_headers).status_code == 204
    dashboard_permission = next(item for item in catalog if item["key"] == "dashboard")
    assert client.delete(f"/api/v1/permissions/{dashboard_permission['id']}", headers=admin_headers).status_code == 409
