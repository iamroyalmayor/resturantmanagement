"""Base repository with shared session access."""

from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepository:
    """Base class for repositories using an async SQLAlchemy session."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @property
    def session(self) -> AsyncSession:
        return self._session
