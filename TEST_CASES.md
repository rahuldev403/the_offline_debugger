# 🎯 Test Cases for AutoFix AI

## Quick Test (Division by Zero)

```python
# Example: Code with a bug
print("Starting calculation...")
x = 100
y = 0
result = x / y  # This will cause a ZeroDivisionError
print(f"Result: {result}")
```

## Additional Test Cases

### 1. Syntax Error (Missing Colon)

```python
def greet(name)
    print(f"Hello, {name}!")

greet("World")
```

### 2. NameError (Undefined Variable)

```python
print("Calculating...")
total = price * quantity
print(f"Total: {total}")
```

### 3. Type Error

```python
numbers = [1, 2, 3]
result = numbers + "hello"
print(result)
```

### 4. Index Out of Range

```python
items = ["apple", "banana", "cherry"]
print(items[0])
print(items[5])
```

### 5. Indentation Error

```python
for i in range(5):
print(i)
print("Done")
```

### 6. Multiple Issues

```python
def calculate_average(numbers)
    total = 0
    for num in numbers:
        total += num
    average = total / len(numbers)
    print(f"Average is: {averge}")
    return average

result = calculate_average([10, 20, 30])
```

### 7. Infinite Loop (Tests Timeout)

```python
while True:
    print("This will timeout!")
```

### 8. Import Error

```python
import non_existent_module
non_existent_module.do_something()
```

## Expected Behavior

1. **Code Execution**: Runs in Docker with 128MB RAM, no network, 5s timeout
2. **Error Detection**: Captures stdout/stderr and exit code
3. **AI Analysis**: Ollama explains the bug
4. **Code Fix**: AI provides corrected code
5. **Diff Display**: Shows unified diff of changes
6. **Retry Loop**: Up to max_retries attempts
7. **Success/Failure**: Final status shown with visual indicators

## How to Test

1. Open http://localhost:3000
2. Paste one of the test cases above
3. Set max retries (1-10)
4. Click "🚀 Start Debugging"
5. Watch the autonomous debugging process
