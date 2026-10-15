import signal
import threading


class ProcessManager:
    """
    Coordinates graceful shutdown. SIGINT/SIGTERM sets shutdown_event, which
    app.py's poll loop and heartbeat loop check between iterations, and
    which app.py's shutdown hook waits on (up to
    settings.SHUTDOWN_GRACE_PERIOD_SECONDS) for any in-flight job to finish
    before deregistering the worker and exiting -- so the node doesn't just
    vanish mid-lease and force apps/api to wait out the full lease timeout
    before the job becomes reclaimable.
    """

    def __init__(self):
        self.shutdown_event = threading.Event()
        self._registered = False

    def install_signal_handlers(self) -> None:
        if self._registered:
            return
        try:
            signal.signal(signal.SIGINT, self._handle_signal)
            signal.signal(signal.SIGTERM, self._handle_signal)
            self._registered = True
        except ValueError:
            # Not the main thread (e.g. under some test runners/servers) --
            # the caller is responsible for triggering shutdown some other way.
            pass

    def _handle_signal(self, signum, frame) -> None:
        self.shutdown_event.set()

    def is_shutting_down(self) -> bool:
        return self.shutdown_event.is_set()
