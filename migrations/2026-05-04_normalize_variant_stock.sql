UPDATE products
SET
  stock = (
    SELECT COALESCE(SUM(CASE WHEN pv.is_active = 1 THEN COALESCE(pv.stock, 0) ELSE 0 END), 0)
    FROM product_variants pv
    WHERE pv.product_id = products.id
  ),
  last_stock_update = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT DISTINCT product_id
  FROM product_variants
);
