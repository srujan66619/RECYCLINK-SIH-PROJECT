from typing import TypeVar, Generic, Sequence, List
from pydantic import BaseModel

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

def paginate(items: Sequence[T], total: int, page: int = 1, size: int = 50) -> PaginatedResponse[T]:
    pages = (total + size - 1) // size if size > 0 else 1
    return PaginatedResponse(
        items=list(items),
        total=total,
        page=page,
        size=size,
        pages=pages
    )
