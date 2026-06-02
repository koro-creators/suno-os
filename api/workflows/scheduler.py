"""Cloud Scheduler integration for workflow automation.

In production, creates/updates/deletes Cloud Scheduler jobs that trigger
workflow runs via HTTP POST to the API.

In development (or when google-cloud-scheduler is not installed),
provides a mock implementation that logs actions.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


class WorkflowScheduler:
    """Manages Cloud Scheduler jobs for workflow cron schedules."""

    def __init__(
        self,
        project_id: str = "",
        location: str = "us-central1",
        api_base_url: str = "",
    ) -> None:
        self.project_id = project_id
        self.location = location
        self.api_base_url = api_base_url
        self._client = None

    def _get_client(self):
        """Lazily create Cloud Scheduler client. Returns None if unavailable."""
        if self._client is None:
            try:
                from google.cloud import scheduler_v1

                self._client = scheduler_v1.CloudSchedulerClient()
            except ImportError:
                logger.warning("google-cloud-scheduler not installed, using mock scheduler")
                return None
        return self._client

    def _job_name(self, workflow_id: str) -> str:
        return f"projects/{self.project_id}/locations/{self.location}/jobs/workflow-{workflow_id}"

    async def create_or_update(
        self,
        workflow_id: str,
        cron: str,
        timezone: str = "America/Sao_Paulo",
    ) -> dict:
        """Create or update a Cloud Scheduler job for the given workflow."""
        client = self._get_client()
        if not client:
            logger.info(
                "Mock: create_or_update schedule for workflow %s — cron=%s tz=%s",
                workflow_id,
                cron,
                timezone,
            )
            return {
                "mock": True,
                "job_name": f"workflow-{workflow_id}",
                "schedule": cron,
                "timezone": timezone,
            }

        from google.cloud import scheduler_v1

        parent = f"projects/{self.project_id}/locations/{self.location}"
        job_name = self._job_name(workflow_id)
        target_url = f"{self.api_base_url}/api/workflows/{workflow_id}/run"

        job = scheduler_v1.Job(
            name=job_name,
            schedule=cron,
            time_zone=timezone,
            http_target=scheduler_v1.HttpTarget(
                uri=target_url,
                http_method=scheduler_v1.HttpMethod.POST,
                headers={"Content-Type": "application/json"},
                body=b'{"input_overrides": {}}',
            ),
        )

        try:
            result = client.update_job(job=job)
            logger.info("Updated scheduler job: %s", job_name)
        except Exception:
            result = client.create_job(parent=parent, job=job)
            logger.info("Created scheduler job: %s", job_name)

        return {
            "job_name": result.name,
            "schedule": result.schedule,
            "timezone": result.time_zone,
            "state": str(result.state),
        }

    async def delete(self, workflow_id: str) -> None:
        """Delete a Cloud Scheduler job."""
        client = self._get_client()
        if not client:
            logger.info("Mock: deleted schedule for workflow %s", workflow_id)
            return

        job_name = self._job_name(workflow_id)
        try:
            client.delete_job(name=job_name)
            logger.info("Deleted scheduler job: %s", job_name)
        except Exception as e:
            logger.warning("Failed to delete scheduler job %s: %s", job_name, e)

    async def pause(self, workflow_id: str) -> None:
        """Pause a Cloud Scheduler job."""
        client = self._get_client()
        if not client:
            logger.info("Mock: paused schedule for workflow %s", workflow_id)
            return

        job_name = self._job_name(workflow_id)
        try:
            client.pause_job(name=job_name)
            logger.info("Paused scheduler job: %s", job_name)
        except Exception as e:
            logger.warning("Failed to pause scheduler job %s: %s", job_name, e)

    async def resume(self, workflow_id: str) -> None:
        """Resume a paused Cloud Scheduler job."""
        client = self._get_client()
        if not client:
            logger.info("Mock: resumed schedule for workflow %s", workflow_id)
            return

        job_name = self._job_name(workflow_id)
        try:
            client.resume_job(name=job_name)
            logger.info("Resumed scheduler job: %s", job_name)
        except Exception as e:
            logger.warning("Failed to resume scheduler job %s: %s", job_name, e)
