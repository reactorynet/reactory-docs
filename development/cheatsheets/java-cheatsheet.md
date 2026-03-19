# Java Command & Syntax Cheat Sheet

## What is Java?

Java is a statically typed, object-oriented, platform-independent language that runs on the JVM (Java Virtual Machine). Modern Java (17+) introduces records, sealed classes, pattern matching, text blocks, and virtual threads.

---

## Quick Reference — CLI Tools

```bash
java --version                     # Show JVM version
javac --version                    # Show compiler version
java -jar app.jar                  # Run a JAR file
javac Main.java                    # Compile a .java file
java Main                          # Run compiled class (no .class extension)
jar --create --file app.jar -C out . # Create a JAR from out/ directory
jshell                             # Interactive Java REPL (Java 9+)
```

---

## Compiling and Running

### Compile and Run a Single File (Java 11+)
```bash
java Main.java                     # Compile and run in one step (no separate javac)
java --enable-preview Main.java    # With preview features
```

### Compile a Project
```bash
javac -d out src/**/*.java                     # Compile all .java → out/
javac -cp lib/mylib.jar -d out src/Main.java   # With classpath
javac -source 21 -target 21 -d out src/Main.java
```

### Run a Compiled Class
```bash
java -cp out com.example.Main
java -cp "out:lib/*" com.example.Main          # Multiple classpath entries (Linux/Mac)
java -cp "out;lib/*" com.example.Main          # Windows
```

### JVM Flags
```bash
java -Xmx512m -Xms128m -jar app.jar            # Heap: max 512MB, initial 128MB
java -XX:+UseZGC -jar app.jar                  # Use ZGC garbage collector
java -Dmy.prop=value -jar app.jar              # Set a system property
java -ea -jar app.jar                          # Enable assertions
java -verbose:gc -jar app.jar                  # Log GC events
java --add-opens java.base/java.lang=ALL-UNNAMED -jar app.jar
```

---

## Language Basics

### Hello World
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### Variables and Types
```java
// Primitive types
int x = 42;
long l = 100_000_000L;
double d = 3.14;
float f = 3.14f;
boolean flag = true;
char c = 'A';
byte b = 127;
short s = 32_000;

// Reference types
String name = "Reactory";
String text = """
    Multi-line
    text block
    """;               // Text block (Java 15+)

// Type inference (Java 10+)
var list = new ArrayList<String>();
var count = 42;
```

### Operators
```java
+  -  *  /  %           // Arithmetic
==  !=  <  >  <=  >=    // Comparison
&&  ||  !                // Logical
&   |   ^   ~   <<  >>  >>> // Bitwise
=  +=  -=  *=  /=  %=   // Assignment
++  --                   // Increment/decrement
?:                       // Ternary
instanceof               // Type check
```

### Strings
```java
String s = "Hello";
s.length()               // 5
s.charAt(0)              // 'H'
s.substring(1, 3)        // "el"
s.toUpperCase()          // "HELLO"
s.toLowerCase()          // "hello"
s.trim()                 // Remove leading/trailing whitespace
s.strip()                // Unicode-aware trim (Java 11+)
s.contains("ell")        // true
s.startsWith("He")       // true
s.endsWith("lo")         // true
s.replace("l", "r")      // "Herro"
s.split(",")             // String[]
s.isEmpty()              // false
s.isBlank()              // false (Java 11+)
s.repeat(3)              // "HelloHelloHello" (Java 11+)
String.format("Hi %s, you are %d", "Alice", 30)
"Hi %s".formatted("Alice")  // Java 15+

// String comparison
s.equals("Hello")        // true (use equals, not ==)
s.equalsIgnoreCase("hello") // true
s.compareTo("World")     // negative (lexicographic)

// StringBuilder (mutable)
var sb = new StringBuilder();
sb.append("Hello").append(", ").append("World");
sb.toString();
```

---

## Control Flow

### If / Else
```java
if (x > 0) {
    System.out.println("positive");
} else if (x < 0) {
    System.out.println("negative");
} else {
    System.out.println("zero");
}
```

### Switch (Traditional)
```java
switch (day) {
    case "MON": case "TUE":
        System.out.println("Weekday");
        break;
    case "SAT": case "SUN":
        System.out.println("Weekend");
        break;
    default:
        System.out.println("Unknown");
}
```

### Switch Expression (Java 14+)
```java
String label = switch (day) {
    case "MON", "TUE", "WED", "THU", "FRI" -> "Weekday";
    case "SAT", "SUN" -> "Weekend";
    default -> throw new IllegalArgumentException("Unknown day: " + day);
};
```

### Loops
```java
// for
for (int i = 0; i < 10; i++) { System.out.println(i); }

// for-each
for (String item : list) { System.out.println(item); }

// while
while (condition) { /* ... */ }

// do-while
do { /* ... */ } while (condition);

// break and continue
for (int i = 0; i < 10; i++) {
    if (i == 5) break;
    if (i % 2 == 0) continue;
    System.out.println(i);
}
```

---

## Object-Oriented Programming

### Classes
```java
public class Person {
    private final String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    @Override
    public String toString() {
        return "Person{name='%s', age=%d}".formatted(name, age);
    }
}
```

### Records (Java 16+)
```java
// Immutable data class — auto-generates constructor, getters, equals, hashCode, toString
public record Point(double x, double y) {
    // Custom compact constructor for validation
    public Point {
        if (Double.isNaN(x) || Double.isNaN(y)) throw new IllegalArgumentException("NaN");
    }

    // Additional methods are fine
    public double distance() {
        return Math.sqrt(x * x + y * y);
    }
}

var p = new Point(3.0, 4.0);
p.x();        // 3.0
p.y();        // 4.0
```

### Inheritance
```java
public class Animal {
    protected String name;
    public Animal(String name) { this.name = name; }
    public String speak() { return "..."; }
}

public class Dog extends Animal {
    public Dog(String name) { super(name); }

    @Override
    public String speak() { return "Woof!"; }
}
```

### Interfaces
```java
public interface Drawable {
    void draw();                           // Abstract method
    default void print() {                 // Default method
        System.out.println("Drawing: " + getClass().getSimpleName());
    }
    static Drawable noOp() { return () -> {}; }  // Static factory
}

public class Circle implements Drawable {
    @Override
    public void draw() { System.out.println("Drawing circle"); }
}
```

### Sealed Classes (Java 17+)
```java
public sealed interface Shape permits Circle, Rectangle, Triangle {}

public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
public record Triangle(double base, double height) implements Shape {}
```

### Enums
```java
public enum Status {
    PENDING, ACTIVE, INACTIVE;

    public boolean isActive() { return this == ACTIVE; }
}

// Enum with fields
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    EARTH(5.976e+24, 6.37814e6);

    private final double mass;
    private final double radius;

    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }
}
```

---

## Collections

### List
```java
import java.util.*;
import java.util.stream.*;

// Immutable list (Java 9+)
List<String> names = List.of("Alice", "Bob", "Carol");

// Mutable list
List<String> mutable = new ArrayList<>(List.of("Alice", "Bob"));
mutable.add("Dave");
mutable.remove("Bob");
mutable.set(0, "Anna");        // Replace at index
mutable.get(0);                // "Anna"
mutable.size();                // 2
mutable.contains("Dave");      // true
mutable.isEmpty();             // false
Collections.sort(mutable);
Collections.reverse(mutable);
```

### Map
```java
// Immutable map (Java 9+)
Map<String, Integer> scores = Map.of("Alice", 95, "Bob", 87);

// Mutable map
Map<String, Integer> mutable = new HashMap<>(scores);
mutable.put("Carol", 92);
mutable.get("Alice");           // 95
mutable.getOrDefault("Dave", 0); // 0
mutable.containsKey("Bob");     // true
mutable.remove("Bob");
mutable.putIfAbsent("Eve", 88);
mutable.merge("Alice", 5, Integer::sum);  // 95+5=100

for (var entry : mutable.entrySet()) {
    System.out.println(entry.getKey() + " = " + entry.getValue());
}
```

### Set
```java
Set<String> set = new HashSet<>(Set.of("a", "b", "c"));
set.add("d");
set.contains("a");     // true
set.remove("b");
set.size();            // 3
```

### Useful Collections Methods
```java
Collections.sort(list);
Collections.sort(list, Comparator.reverseOrder());
Collections.unmodifiableList(list);
Collections.frequency(list, "Alice");
Collections.max(list);
Collections.min(list);
```

---

## Streams (Java 8+)

```java
import java.util.stream.*;

List<String> names = List.of("Alice", "Bob", "Charlie", "Dave");

// Filter and collect
List<String> longNames = names.stream()
    .filter(n -> n.length() > 4)
    .collect(Collectors.toList());

// Map (transform)
List<String> upper = names.stream()
    .map(String::toUpperCase)
    .toList();                  // Java 16+ shorthand

// Reduce
int totalLength = names.stream()
    .mapToInt(String::length)
    .sum();

// Find and match
Optional<String> first = names.stream()
    .filter(n -> n.startsWith("C"))
    .findFirst();

boolean anyMatch = names.stream().anyMatch(n -> n.contains("li"));
boolean allMatch = names.stream().allMatch(n -> n.length() > 2);
long count = names.stream().filter(n -> n.length() > 3).count();

// Sort and limit
List<String> sorted = names.stream()
    .sorted(Comparator.comparingInt(String::length))
    .limit(3)
    .toList();

// FlatMap
List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4));
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .toList();

// Grouping
Map<Integer, List<String>> byLength = names.stream()
    .collect(Collectors.groupingBy(String::length));

// Joining
String joined = names.stream().collect(Collectors.joining(", "));
```

---

## Optional (Java 8+)

```java
Optional<String> opt = Optional.of("value");
Optional<String> empty = Optional.empty();
Optional<String> nullable = Optional.ofNullable(possiblyNull);

opt.isPresent()           // true
opt.isEmpty()             // false (Java 11+)
opt.get()                 // "value" (throws if empty)
opt.orElse("default")     // "value"
opt.orElseGet(() -> compute())
opt.orElseThrow()         // throws NoSuchElementException if empty
opt.orElseThrow(() -> new RuntimeException("Missing"))
opt.map(String::toUpperCase)  // Optional<String>
opt.filter(s -> s.length() > 3)
opt.ifPresent(System.out::println)
opt.ifPresentOrElse(System.out::println, () -> System.out.println("empty"))
```

---

## Generics

```java
// Generic class
public class Box<T> {
    private T value;
    public Box(T value) { this.value = value; }
    public T get() { return value; }
}

// Generic method
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

// Bounded wildcards
void processNumbers(List<? extends Number> nums) { /* read only */ }
void addNumbers(List<? super Integer> nums) { /* write only */ }

// Common shorthand
List<?>         // Unknown type (read only)
List<? extends Comparable<?>>
```

---

## Exception Handling

```java
// Try-catch-finally
try {
    int result = divide(a, b);
} catch (ArithmeticException e) {
    System.err.println("Division error: " + e.getMessage());
} catch (IllegalArgumentException | NullPointerException e) {
    System.err.println("Argument error: " + e.getMessage());
} finally {
    System.out.println("Always runs");
}

// Try-with-resources (auto-closes Closeable)
try (var reader = new BufferedReader(new FileReader("file.txt"))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}

// Custom exception
public class AppException extends RuntimeException {
    public AppException(String message) { super(message); }
    public AppException(String message, Throwable cause) { super(message, cause); }
}
```

---

## Pattern Matching (Java 16+)

### instanceof Pattern Matching
```java
// Old style
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.toUpperCase());
}

// Pattern matching (Java 16+)
if (obj instanceof String s) {
    System.out.println(s.toUpperCase());
}

// Guarded pattern
if (obj instanceof String s && s.length() > 5) {
    System.out.println("Long string: " + s);
}
```

### Switch Pattern Matching (Java 21+)
```java
String describe(Object obj) {
    return switch (obj) {
        case Integer i when i < 0  -> "Negative int: " + i;
        case Integer i             -> "Positive int: " + i;
        case String s when s.isBlank() -> "Blank string";
        case String s              -> "String: " + s;
        case null                  -> "null";
        default                    -> "Other: " + obj;
    };
}
```

---

## Concurrency

### Threads
```java
// Runnable
Thread t = new Thread(() -> System.out.println("Running"));
t.start();
t.join();   // Wait for thread to finish

// Virtual Threads (Java 21+)
Thread vt = Thread.ofVirtual().start(() -> System.out.println("Virtual thread"));
```

### ExecutorService
```java
import java.util.concurrent.*;

var executor = Executors.newFixedThreadPool(4);
executor.submit(() -> System.out.println("Task"));

Future<Integer> future = executor.submit(() -> computeExpensive());
Integer result = future.get(5, TimeUnit.SECONDS);

executor.shutdown();
executor.awaitTermination(10, TimeUnit.SECONDS);

// Virtual thread executor (Java 21+)
try (var vExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
    vExecutor.submit(() -> System.out.println("Virtual task"));
}
```

### CompletableFuture
```java
CompletableFuture<String> cf = CompletableFuture
    .supplyAsync(() -> fetchData())
    .thenApply(String::toUpperCase)
    .thenApply(s -> "Result: " + s)
    .exceptionally(ex -> "Error: " + ex.getMessage());

cf.join();  // Blocking wait for result
```

---

## File I/O (Java NIO)

```java
import java.nio.file.*;
import java.io.IOException;

Path path = Path.of("data.txt");

// Read
String content = Files.readString(path);
List<String> lines = Files.readAllLines(path);
byte[] bytes = Files.readAllBytes(path);

// Write
Files.writeString(path, "Hello World");
Files.write(path, List.of("line1", "line2"));

// Append
Files.writeString(path, "more text", StandardOpenOption.APPEND);

// Check existence
Files.exists(path)
Files.isDirectory(path)
Files.isRegularFile(path)

// Directory operations
Files.createDirectory(Path.of("newdir"));
Files.createDirectories(Path.of("a/b/c"));
Files.list(Path.of(".")).forEach(System.out::println);          // Directory listing
Files.walk(Path.of("src")).filter(Files::isRegularFile).toList(); // Recursive walk
Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
Files.delete(path);
Files.deleteIfExists(path);
```

---

## Useful Utilities

### Math
```java
Math.abs(-5)              // 5
Math.max(3, 7)            // 7
Math.min(3, 7)            // 3
Math.pow(2, 10)           // 1024.0
Math.sqrt(16)             // 4.0
Math.floor(3.7)           // 3.0
Math.ceil(3.2)            // 4.0
Math.round(3.5)           // 4
Math.random()             // [0.0, 1.0)
Math.PI
Math.E
```

### Arrays
```java
import java.util.Arrays;

int[] arr = {5, 3, 1, 4, 2};
Arrays.sort(arr);                     // [1, 2, 3, 4, 5]
Arrays.binarySearch(arr, 3);         // index of 3
Arrays.fill(arr, 0);                  // [0, 0, 0, 0, 0]
Arrays.copyOf(arr, 3);               // First 3 elements
Arrays.copyOfRange(arr, 1, 4);       // Elements 1-3
Arrays.equals(arr1, arr2);           // Deep equality
Arrays.toString(arr);                 // "[0, 0, 0, 0, 0]"
```

### Objects
```java
import java.util.Objects;

Objects.requireNonNull(value, "value must not be null");
Objects.requireNonNullElse(value, defaultVal);
Objects.isNull(value)
Objects.nonNull(value)
Objects.equals(a, b)        // Null-safe equals
Objects.hash(a, b, c)       // Generate hash from fields
Objects.toString(obj, "N/A") // Null-safe toString
```

---

## Tips and Best Practices

### Prefer Records for Data Classes
```java
// Instead of verbose POJOs, use records (Java 16+)
public record User(String id, String name, String email) {}
```

### Use `var` for Local Type Inference
```java
var users = new ArrayList<User>();
var result = service.findAll();
```

### Prefer `List.of`, `Map.of`, `Set.of` for Immutable Collections
```java
var config = Map.of("host", "localhost", "port", "5432");
```

### Avoid Raw Types
```java
List list = new ArrayList();         // Bad: raw type, no type safety
List<String> list = new ArrayList<>(); // Good
```

### Use `instanceof` Pattern Matching Over Manual Casts
```java
// Prefer
if (shape instanceof Circle c) { return Math.PI * c.radius() * c.radius(); }

// Over
if (shape instanceof Circle) { Circle c = (Circle) shape; ... }
```

### Enable Preview Features for Cutting-Edge Syntax
```bash
javac --enable-preview --release 21 Main.java
java --enable-preview Main
```
