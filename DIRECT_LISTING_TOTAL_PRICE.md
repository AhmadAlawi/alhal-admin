# البيع المباشر — السعر الإجمالي

## النموذج الجديد

| الحقل | المعنى |
|--------|--------|
| `price` (عند الإنشاء) | **السعر الإجمالي** للعرض كاملاً |
| `totalPrice` (في الاستجابة) | نفس القيمة |
| `availableQty` | الكمية الكاملة (كغ عادة) |
| `pricePerUnit` | للعرض فقط: `totalPrice / availableQty` |
| `subtotal` (الطلب) | دائماً = `totalPrice` |

## API

### إنشاء عرض
```http
POST /api/direct-sales/listings
{
  "sellerUserId": 1,
  "cropId": 10,
  "title": "بندورة درعا",
  "price": 1500000
}
```
`price` = إجمالي مبلغ البيع (مثلاً 1,500,000 ل.س لـ 500 كغ).

### شراء
```http
POST /api/direct-sales/orders
{
  "listingId": 42,
  "buyerUserId": 2,
  "deliveryAddress": "..."
}
```
- `qty` اختياري — إن أُرسل يجب أن يساوي `availableQty`.
- المجموع = `totalPrice` (لا ضرب في الكمية).

### تحديث عرض
```json
{ "listingId": 42, "totalPrice": 1600000 }
```

## الموبايل

- عرض: **«السعر: 1,500,000 ل.س»** (إجمالي) + **«الكمية: 500 كغ»**.
- اختياري: «يعادل 3,000 ل.س / كغ» من `pricePerUnit`.
- لا تضرب السعر × الكمية في السلة.

## Migration

`20260522194236_AddDirectListingTotalPrice` — يحوّل البيانات القديمة: `TotalPrice = UnitPrice × AvailableQty`.
