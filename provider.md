# test\cases\04_extension.multiline.test.ts
## 案例 not template - whitespaces
###### Lauch Extension 手動測試結果

# not template - whitespaces - first expression
## original
```python
if ( \
    a and (b and \
    a \
    .a \
    .b){not} \
): \
pass
```

## expected
```python
if ( \
    a and (not b or \
    not a \
    .a \
    .b) \
): \
pass
```

## actual
```python
if ( \
    a and (not b or \
    not a \
    .a \
    .b) \ \
): \
pass
```


# not template - whitespaces - second expression
## original
```python
if ( \
    a and (b and \
    a \
    .a \
    .b){not} \
): \
pass
```

# expected
```python
if ( \
    not a or (not b or \
    not a \
    .a \
    .b) \
): \
pass
```

# actual
```python
if ( \
    not a or (not b or \
    not a \
    .a \
    .b) \ \
): \
pass
```


# not template - whitespaces - third expression
## original
```python
if ( \
    a and (b and \
    a \
    .a \
    .b){not} \
): \
pass
```

# expected
```python
if ( \
    not a and (b and \
    a \
    .a \
    .b) \
): \
pass
```

# actual
```python
if ( \
    not aand (b and \
    a \
    .a \
    .b). \
): \
pass
```
