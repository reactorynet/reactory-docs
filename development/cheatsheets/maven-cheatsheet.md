# Maven Command Cheat Sheet

## What is Maven?

Apache Maven is a build automation and dependency management tool for JVM projects. It uses a declarative XML build file (`pom.xml` — Project Object Model) and follows strict conventions for project layout. Maven resolves dependencies from the Maven Central repository (and others) into a local cache at `~/.m2/repository/`.

---

## Quick Reference

```bash
mvn clean install          # Clean, compile, test, package, install to local repo
mvn clean package          # Clean, compile, test, package (skip local install)
mvn clean verify           # Clean, compile, test, integration-test, verify
mvn compile                # Compile source code
mvn test                   # Run unit tests
mvn package                # Package the project (JAR/WAR)
mvn install                # Install artifact to local ~/.m2 repository
mvn deploy                 # Deploy to remote repository
mvn dependency:tree        # Print full dependency tree
mvn help:effective-pom     # Show the fully resolved POM
```

---

## Lifecycle Phases

Maven has three built-in lifecycles. Running a phase also runs all preceding phases.

### Default Lifecycle (most common)
```
validate → initialize → generate-sources → process-sources →
generate-resources → process-resources → compile → process-classes →
generate-test-sources → process-test-sources → generate-test-resources →
process-test-resources → test-compile → process-test-classes → test →
prepare-package → package → pre-integration-test → integration-test →
post-integration-test → verify → install → deploy
```

### Clean Lifecycle
```bash
mvn pre-clean
mvn clean        # Delete target/ directory
mvn post-clean
```

### Site Lifecycle
```bash
mvn site         # Generate project documentation site
mvn site:deploy  # Deploy the documentation site
```

---

## Building

### Compile and Package
```bash
mvn compile                     # Compile main source
mvn test-compile                # Compile test source
mvn package                     # Compile + test + package
mvn package -DskipTests         # Package, skip running tests
mvn package -Dmaven.test.skip=true  # Package, skip compiling AND running tests
mvn clean package               # Clean then package
```

### Install and Deploy
```bash
mvn install                     # Install to local ~/.m2
mvn install -DskipTests         # Install without running tests
mvn deploy                      # Upload to remote repository (requires distributionManagement)
```

### Run the Application
```bash
mvn exec:java -Dexec.mainClass="com.example.Main"
mvn exec:java -Dexec.mainClass="com.example.Main" -Dexec.args="arg1 arg2"
mvn spring-boot:run             # Spring Boot Maven plugin
```

---

## Testing

### Run Tests
```bash
mvn test                                          # All tests
mvn test -Dtest=MyClassTest                       # Specific class
mvn test -Dtest=MyClassTest#myMethod              # Specific method
mvn test -Dtest="MyClassTest,AnotherTest"         # Multiple classes
mvn test -Dtest="com.example.*"                   # Wildcard package
```

### Skip Tests
```bash
mvn package -DskipTests                           # Skip execution, still compile
mvn package -Dmaven.test.skip=true                # Skip compile AND execution
```

### Test Reports
```bash
# Surefire reports (unit tests)
open target/surefire-reports/

# Failsafe reports (integration tests)
open target/failsafe-reports/
```

### Run Integration Tests
```bash
mvn verify                     # Runs integration-test + verify phases
mvn failsafe:integration-test  # Failsafe plugin directly
```

---

## Dependencies

### View Dependency Tree
```bash
mvn dependency:tree
mvn dependency:tree -Dincludes=org.springframework:*    # Filter by group
mvn dependency:tree -Dverbose                           # Show conflicts/omissions
```

### Analyze Dependencies
```bash
mvn dependency:analyze          # Find unused declared / undeclared used deps
mvn dependency:resolve          # Resolve and display all dependencies
mvn dependency:resolve-sources  # Download sources JARs
mvn dependency:sources          # Alias for resolve-sources
```

### Force Update Snapshots
```bash
mvn install -U                  # Force update snapshot dependencies
```

### Download a Single Dependency
```bash
mvn dependency:get -Dartifact=org.apache.commons:commons-lang3:3.14.0
```

### Copy Dependencies to a Folder
```bash
mvn dependency:copy-dependencies -DoutputDirectory=libs
```

---

## Profiles

### Activate a Profile
```bash
mvn package -Pprod              # Activate 'prod' profile
mvn package -Pprod,metrics      # Activate multiple profiles
mvn package -P!dev              # Deactivate a profile
```

### List Active Profiles
```bash
mvn help:active-profiles
```

### Define a Profile in pom.xml
```xml
<profiles>
  <profile>
    <id>prod</id>
    <properties>
      <spring.profiles.active>prod</spring.profiles.active>
    </properties>
    <build>
      <plugins><!-- ... --></plugins>
    </build>
  </profile>
</profiles>
```

---

## Multi-Module Projects

### Structure
```
parent-project/
├── pom.xml                  # Parent POM (packaging: pom)
├── module-a/
│   └── pom.xml
└── module-b/
    └── pom.xml
```

```xml
<!-- Parent pom.xml -->
<packaging>pom</packaging>
<modules>
  <module>module-a</module>
  <module>module-b</module>
</modules>
```

### Build Commands
```bash
mvn install                              # Build all modules in reactor order
mvn install -pl module-a                 # Build specific module(s)
mvn install -pl module-a -am            # Build module-a and its dependencies
mvn install -pl module-a -amd           # Build module-a and modules depending on it
mvn install -rf :module-b               # Resume from a specific module
```

### Parallel Builds
```bash
mvn install -T 4                 # Use 4 threads
mvn install -T 1C                # 1 thread per CPU core
```

---

## Plugins

### Run Plugin Goals Directly
```bash
mvn plugin:goal
mvn compiler:compile
mvn surefire:test
mvn resources:resources
mvn jar:jar
```

### Common Plugins and Goals
```bash
# Code formatting
mvn spotless:apply               # Apply code formatting (Spotless plugin)
mvn spotless:check               # Check formatting without fixing

# Static analysis
mvn checkstyle:check             # Checkstyle violations
mvn pmd:check                    # PMD violations
mvn spotbugs:check               # SpotBugs (formerly FindBugs)

# Code coverage
mvn jacoco:report                # Generate JaCoCo coverage report

# Spring Boot
mvn spring-boot:run              # Run the app
mvn spring-boot:build-image      # Build OCI image via Cloud Native Buildpacks

# Docker
mvn jib:build                    # Build & push Docker image (Jib plugin)
mvn jib:dockerBuild              # Build to local Docker daemon
```

### List Available Plugin Goals
```bash
mvn help:describe -Dplugin=org.apache.maven.plugins:maven-surefire-plugin
mvn help:describe -Dplugin=compiler -Ddetail
```

---

## Version Management

### Update Project Version
```bash
mvn versions:set -DnewVersion=2.0.0
mvn versions:set -DnewVersion=2.0.0-SNAPSHOT
mvn versions:revert             # Revert to previous version (before committing)
mvn versions:commit             # Remove backup pom.xml.versionsBackup files
```

### Find Outdated Dependencies
```bash
mvn versions:display-dependency-updates
mvn versions:display-plugin-updates
mvn versions:use-latest-releases       # Auto-update to latest releases
```

---

## The POM File

### Minimal pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <properties>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.10.0</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
```

### Dependency Scopes
| Scope | Compile | Test | Runtime | Description |
|---|---|---|---|---|
| `compile` (default) | Yes | Yes | Yes | Available everywhere |
| `provided` | Yes | Yes | No | Provided by runtime (e.g. servlet-api) |
| `runtime` | No | Yes | Yes | Needed at runtime, not compile |
| `test` | No | Yes | No | Test code only |
| `system` | Yes | Yes | No | Explicit local JAR path |
| `import` | — | — | — | BOM import in `<dependencyManagement>` |

### Spring Boot Parent POM
```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.2.0</version>
</parent>
```

### Bill of Materials (BOM)
```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-dependencies</artifactId>
      <version>2023.0.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

---

## Settings and Repositories

### ~/.m2/settings.xml
```xml
<settings>
  <mirrors>
    <mirror>
      <id>central-mirror</id>
      <mirrorOf>central</mirrorOf>
      <url>https://nexus.example.com/repository/maven-public/</url>
    </mirror>
  </mirrors>

  <servers>
    <server>
      <id>nexus</id>
      <username>${env.NEXUS_USER}</username>
      <password>${env.NEXUS_PASS}</password>
    </server>
  </servers>

  <profiles>
    <profile>
      <id>nexus</id>
      <repositories>
        <repository>
          <id>nexus</id>
          <url>https://nexus.example.com/repository/maven-public/</url>
          <snapshots><enabled>true</enabled></snapshots>
        </repository>
      </repositories>
    </profile>
  </profiles>

  <activeProfiles>
    <activeProfile>nexus</activeProfile>
  </activeProfiles>
</settings>
```

---

## Useful Flags

```bash
-DskipTests                  # Skip test execution
-Dmaven.test.skip=true       # Skip test compilation and execution
-U                           # Force update of snapshot dependencies
-o                           # Offline mode (use cached artifacts only)
-q                           # Quiet output
-X                           # Debug output
-e                           # Show exception stack traces
-B                           # Batch mode (no ANSI, no interactive; ideal for CI)
-pl <module>                 # Project list (specific module)
-am                          # Also build dependency modules
-amd                         # Also build modules that depend on listed modules
-rf :<module>                # Resume from module
-T <n>                       # Parallel thread count
--no-transfer-progress       # Suppress download progress bars (CI-friendly)
```

---

## Tips and Best Practices

### Use the Maven Wrapper
```bash
mvn -N io.takari:maven:wrapper      # Generate wrapper
./mvnw clean install                # Use wrapper
```
Commit `mvnw`, `mvnw.cmd`, and `.mvn/` to version control for reproducible builds.

### Prefer `<dependencyManagement>` in Multi-Module Projects
Declare versions in the parent `<dependencyManagement>` block; child modules omit the version tag. This prevents version drift across modules.

### Use `-B` and `--no-transfer-progress` in CI
```bash
./mvnw -B --no-transfer-progress clean verify
```
Produces clean, parseable logs without progress spinners.

### Pin Java Version with Toolchains (Maven 3.8+)
```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-toolchains-plugin</artifactId>
  <version>3.1.0</version>
  <configuration>
    <toolchains>
      <jdk>
        <version>21</version>
      </jdk>
    </toolchains>
  </configuration>
</plugin>
```

### Clean the Local Repository Cache
```bash
mvn dependency:purge-local-repository         # Remove project deps from ~/.m2
find ~/.m2 -name "*.lastUpdated" -delete      # Remove stale update markers
```
