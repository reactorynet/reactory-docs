# Gradle Command Cheat Sheet

## What is Gradle?

Gradle is a flexible, open-source build automation tool used primarily for JVM projects (Java, Kotlin, Groovy, Scala, Android). It uses a Groovy or Kotlin DSL for build scripts (`build.gradle` / `build.gradle.kts`) and supports incremental builds, build caching, and dependency management via Maven Central, Google, JCenter, and more.

---

## Quick Reference

```bash
./gradlew tasks              # List all available tasks
./gradlew build              # Compile, test, and assemble
./gradlew test               # Run tests
./gradlew clean              # Delete build directory
./gradlew assemble           # Assemble outputs (no tests)
./gradlew check              # Run all verification tasks (tests + lint)
./gradlew dependencies       # Show dependency tree
./gradlew properties         # Show project properties
```

> Always use the Gradle wrapper (`./gradlew`) rather than a globally installed `gradle` to ensure reproducible builds.

---

## Wrapper

### Generate / Update the Wrapper
```bash
gradle wrapper                              # Generate wrapper at current Gradle version
gradle wrapper --gradle-version 8.7        # Pin to a specific version
gradle wrapper --distribution-type all     # Include sources (useful for IDEs)
```
Commit the wrapper files (`gradlew`, `gradlew.bat`, `gradle/wrapper/`) to version control.

### Check Wrapper Version
```bash
./gradlew --version
```

---

## Building

### Build the Project
```bash
./gradlew build          # Compile + test + assemble (full build)
./gradlew assemble       # Compile and package (skip tests)
./gradlew clean build    # Clean then full build
./gradlew build --rerun-tasks   # Force re-run all tasks (bypass up-to-date check)
```

### Compile Only
```bash
./gradlew compileJava
./gradlew compileTestJava
./gradlew compileKotlin       # Kotlin projects
```

### Package / Archive
```bash
./gradlew jar                 # Build a JAR
./gradlew bootJar             # Spring Boot executable JAR
./gradlew war                 # Build a WAR
./gradlew distZip             # Build a distributable ZIP
./gradlew distTar             # Build a distributable TAR
```

---

## Testing

### Run Tests
```bash
./gradlew test                            # Run all unit tests
./gradlew test --tests "com.example.*"   # Run tests matching a package
./gradlew test --tests "MyClassTest"     # Run a specific test class
./gradlew test --tests "MyClassTest.myMethod"  # Run a specific test method
./gradlew test --rerun-tasks             # Force re-run even if up-to-date
```

### Test Filtering
```bash
./gradlew test --tests "*IntegrationTest"
./gradlew test -PincludeTags=fast        # Filter by JUnit 5 tags (custom setup)
```

### Test Reports
```bash
# HTML report generated at:
open build/reports/tests/test/index.html
```

### Skip Tests
```bash
./gradlew build -x test       # Exclude the test task
./gradlew assemble            # assemble never runs tests
```

---

## Dependencies

### View Dependencies
```bash
./gradlew dependencies                              # All configurations
./gradlew dependencies --configuration runtimeClasspath
./gradlew dependencies --configuration testRuntimeClasspath
./gradlew :module:dependencies                      # Dependencies for a subproject
```

### Dependency Insight
```bash
./gradlew dependencyInsight --dependency spring-core --configuration compileClasspath
```
Explains why a specific dependency is included and what requested it.

### Refresh Dependencies
```bash
./gradlew build --refresh-dependencies    # Ignore cached resolution results
```

### List Outdated Dependencies
```bash
# With the Versions plugin (com.github.ben-manes.versions)
./gradlew dependencyUpdates
./gradlew dependencyUpdates -Drevision=release
```

---

## Multi-Project Builds

### Structure
```
root-project/
├── settings.gradle(.kts)    # Declares subprojects
├── build.gradle(.kts)       # Root build config (allprojects/subprojects)
├── module-a/
│   └── build.gradle(.kts)
└── module-b/
    └── build.gradle(.kts)
```

```groovy
// settings.gradle
rootProject.name = 'my-project'
include 'module-a', 'module-b'
```

### Run Tasks on Subprojects
```bash
./gradlew :module-a:build              # Build a specific subproject
./gradlew :module-a:test               # Test a specific subproject
./gradlew :module-a:dependencies       # Dependencies of a subproject

# Run a task on all subprojects
./gradlew build                        # Builds all subprojects
./gradlew subprojects                  # List subprojects
```

### Parallel Execution
```bash
./gradlew build --parallel             # Build subprojects in parallel
```

---

## Performance

### Build Cache
```bash
./gradlew build --build-cache          # Enable local build cache
```
Enable globally in `~/.gradle/gradle.properties`:
```properties
org.gradle.caching=true
```

### Configuration Cache (Gradle 8+)
```bash
./gradlew build --configuration-cache
```
Enable globally:
```properties
org.gradle.configuration-cache=true
```

### Daemon
```bash
./gradlew build --no-daemon            # Disable daemon for this run
./gradlew --stop                       # Stop all running daemons
```
The Gradle daemon is enabled by default and dramatically speeds up consecutive builds.

### Profiling
```bash
./gradlew build --profile              # Generate HTML build profile report
# Report at: build/reports/profile/
```

---

## Logging and Output

```bash
./gradlew build -q              # Quiet (errors only)
./gradlew build                 # Lifecycle (default)
./gradlew build -i              # Info
./gradlew build -d              # Debug (very verbose)
./gradlew build --warning-mode all    # Show all deprecation warnings
./gradlew build --console=plain       # Disable rich console output (CI-friendly)
./gradlew build --scan              # Publish a Build Scan to scans.gradle.com
```

---

## Common Configurations (Groovy DSL)

### build.gradle — Java Application
```groovy
plugins {
    id 'java'
    id 'application'
}

group = 'com.example'
version = '1.0.0'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

application {
    mainClass = 'com.example.Main'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter:3.2.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

test {
    useJUnitPlatform()
}
```

### build.gradle.kts — Kotlin DSL
```kotlin
plugins {
    kotlin("jvm") version "2.0.0"
    application
}

group = "com.example"
version = "1.0.0"

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("com.example.MainKt")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
```

### Spring Boot Plugin
```groovy
plugins {
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
    id 'java'
}
```
```bash
./gradlew bootRun              # Start the Spring Boot app
./gradlew bootJar              # Build executable fat JAR
./gradlew bootBuildImage       # Build OCI image via Buildpacks
```

---

## Publishing

### Publish to Local Maven Repository (~/.m2)
```bash
./gradlew publishToMavenLocal
./gradlew install              # Legacy alias (requires maven plugin)
```

### Publish to Remote Repository
```groovy
// build.gradle
plugins {
    id 'maven-publish'
}

publishing {
    publications {
        mavenJava(MavenPublication) {
            from components.java
        }
    }
    repositories {
        maven {
            url = uri("https://repo.example.com/releases")
            credentials {
                username = findProperty("repoUser") ?: System.getenv("REPO_USER")
                password = findProperty("repoPassword") ?: System.getenv("REPO_PASS")
            }
        }
    }
}
```
```bash
./gradlew publish
```

---

## Useful gradle.properties Settings

```properties
# ~/.gradle/gradle.properties  (global) or  <project>/gradle.properties  (project-scoped)

org.gradle.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=512m   # Increase heap
org.gradle.parallel=true                                # Parallel project execution
org.gradle.caching=true                                 # Local build cache
org.gradle.configuration-cache=true                     # Configuration cache
org.gradle.daemon=true                                  # Daemon (default true)
org.gradle.warning.mode=all                             # Show deprecation warnings
```

---

## Tips and Best Practices

### Avoid Running `gradle` Directly
Always use `./gradlew` so all developers and CI pipelines use the same Gradle version defined in the wrapper.

### Incremental Builds
Gradle skips tasks whose inputs and outputs haven't changed. Mark custom tasks with `@InputFiles`, `@OutputDirectory`, etc. to benefit from incremental builds.

### Avoid `compile` / `runtime` Configurations
Use `implementation` and `runtimeOnly` instead — `compile` and `runtime` were removed in Gradle 7.

```groovy
// Correct (Gradle 7+)
dependencies {
    implementation 'com.google.guava:guava:32.1.3-jre'
    runtimeOnly 'org.postgresql:postgresql:42.7.0'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}
```

### Use Version Catalogs (Gradle 7.4+)
```toml
# gradle/libs.versions.toml
[versions]
junit = "5.10.0"
spring-boot = "3.2.0"

[libraries]
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }
spring-boot-starter = { module = "org.springframework.boot:spring-boot-starter", version.ref = "spring-boot" }
```
```groovy
// build.gradle
dependencies {
    implementation libs.spring.boot.starter
    testImplementation libs.junit.jupiter
}
```
