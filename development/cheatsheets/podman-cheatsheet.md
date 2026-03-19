# Podman Command Cheat Sheet

## What is Podman?

Podman is a daemonless, rootless container engine for developing, managing, and running OCI containers. It is largely Docker-compatible (most `docker` commands map directly to `podman`) but runs without a background daemon and supports rootless operation by default.

```bash
# Alias podman as docker (optional convenience)
alias docker=podman
```

---

## Quick Reference

```bash
podman ps                        # List running containers
podman ps -a                     # List all containers (including stopped)
podman images                    # List local images
podman pull <image>              # Pull an image from a registry
podman run -it <image> /bin/bash # Start an interactive container
podman stop <container>          # Stop a running container
podman rm <container>            # Remove a container
podman rmi <image>               # Remove an image
podman logs <container>          # View container logs
podman inspect <container>       # Inspect container details
```

---

## Images

### Pull an Image
```bash
podman pull docker.io/library/ubuntu:22.04
podman pull quay.io/fedora/fedora:latest
podman pull <registry>/<image>:<tag>
```
Download an image from a container registry.

### List Images
```bash
podman images
podman images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
podman images -a  # Include intermediate images
```
Show all locally stored images.

### Search for Images
```bash
podman search nginx
podman search --filter=is-official nginx
podman search --list-tags docker.io/library/node
```
Search registries for images.

### Remove Images
```bash
podman rmi <image>
podman rmi <image1> <image2>
podman rmi -f <image>         # Force remove (even if used by stopped container)
podman image prune            # Remove dangling (untagged) images
podman image prune -a         # Remove all unused images
```
Delete images from local storage.

### Tag and Push Images
```bash
podman tag <image> <registry>/<namespace>/<name>:<tag>
podman push <registry>/<namespace>/<name>:<tag>
podman push --creds user:password <image>
```
Tag a local image and push to a registry.

### Save and Load Images
```bash
podman save -o myimage.tar <image>
podman save --format oci-archive -o myimage.tar <image>
podman load -i myimage.tar
```
Export and import images as tarballs (useful for air-gapped environments).

### Inspect an Image
```bash
podman inspect <image>
podman image inspect <image> --format "{{.Os}}/{{.Architecture}}"
podman history <image>
```
View image metadata, layers, and build history.

---

## Containers

### Run a Container
```bash
podman run <image>
podman run -it <image> /bin/bash           # Interactive with TTY
podman run -d <image>                      # Detached (background)
podman run --name mycontainer <image>      # Named container
podman run --rm <image>                    # Auto-remove on exit
podman run -p 8080:80 <image>             # Port mapping host:container
podman run -v /host/path:/container/path <image>  # Volume mount
podman run -e MY_VAR=value <image>        # Environment variable
podman run --env-file .env <image>        # Environment from file
podman run --user 1000:1000 <image>       # Run as specific UID:GID
podman run --cpus 2 --memory 512m <image> # Resource limits
```
Start a new container from an image.

### List Containers
```bash
podman ps                   # Running containers
podman ps -a                # All containers (running + stopped)
podman ps -q                # Only container IDs
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Show container status.

### Start, Stop, and Restart
```bash
podman start <container>
podman stop <container>
podman stop -t 5 <container>     # Stop with 5s grace period
podman restart <container>
podman kill <container>          # Send SIGKILL immediately
podman kill -s SIGHUP <container> # Send a specific signal
```
Control container lifecycle.

### Remove Containers
```bash
podman rm <container>
podman rm -f <container>         # Force remove running container
podman rm $(podman ps -aq)       # Remove all stopped containers
podman container prune           # Remove all stopped containers (interactive confirm)
podman container prune -f        # Remove all stopped containers (no confirm)
```
Delete containers from local storage.

### Exec Into a Running Container
```bash
podman exec -it <container> /bin/bash
podman exec -it <container> sh
podman exec <container> ls /app
podman exec -u root <container> /bin/bash   # Exec as root
```
Run a command inside an already-running container.

### Logs
```bash
podman logs <container>
podman logs -f <container>               # Follow (tail -f style)
podman logs --tail 50 <container>        # Last 50 lines
podman logs --since 1h <container>       # Logs from last hour
podman logs --timestamps <container>     # Include timestamps
```
View standard output/error from a container.

### Inspect and Stats
```bash
podman inspect <container>
podman inspect --format "{{.NetworkSettings.IPAddress}}" <container>
podman stats                             # Live resource usage (all containers)
podman stats <container>                 # Live resource usage (specific container)
podman top <container>                   # Running processes inside container
```
Monitor container resource usage and configuration.

### Copy Files
```bash
podman cp <container>:/path/to/file /host/path
podman cp /host/path <container>:/path/to/file
```
Copy files between the host and a container.

### Pause and Unpause
```bash
podman pause <container>
podman unpause <container>
```
Suspend and resume container processes.

---

## Building Images

### Build from Dockerfile / Containerfile
```bash
podman build -t myapp:latest .
podman build -t myapp:1.0 -f Containerfile .
podman build -t myapp:latest --build-arg VERSION=1.2.3 .
podman build --no-cache -t myapp:latest .
podman build --pull -t myapp:latest .         # Always pull base image
```
Build an image from a Containerfile/Dockerfile in the current directory.

### Multi-Stage Builds
```dockerfile
# Containerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```
Use multi-stage builds to produce lean production images.

### Build with Buildah (Podman's build backend)
```bash
buildah from docker.io/library/ubuntu:22.04
buildah run <container> -- apt-get update
buildah commit <container> myimage:latest
buildah push myimage:latest docker://quay.io/myuser/myimage:latest
```
Use Buildah directly for fine-grained image construction.

---

## Volumes

### Named Volumes
```bash
podman volume create myvolume
podman volume ls
podman volume inspect myvolume
podman volume rm myvolume
podman volume prune              # Remove all unused volumes
```
Create and manage persistent named volumes.

### Mount a Volume
```bash
podman run -v myvolume:/data <image>
podman run -v /host/dir:/container/dir:Z <image>   # :Z relabels for SELinux
podman run -v /host/dir:/container/dir:ro <image>  # Read-only mount
```
Attach volumes and bind mounts to containers. Use `:Z` when SELinux is enforcing.

---

## Networking

### List and Create Networks
```bash
podman network ls
podman network create mynet
podman network create --subnet 10.88.0.0/16 mynet
podman network inspect mynet
podman network rm mynet
podman network prune
```
Manage container networks.

### Connect Containers to Networks
```bash
podman run --network mynet <image>
podman network connect mynet <container>
podman network disconnect mynet <container>
```
Attach containers to custom networks for name-based DNS resolution.

### Port Mapping
```bash
podman run -p 8080:80 <image>            # Map host 8080 → container 80
podman run -p 127.0.0.1:8080:80 <image> # Bind to loopback only
podman run -P <image>                    # Map all exposed ports randomly
podman port <container>                  # List port mappings for container
```
Expose container ports to the host.

---

## Pods

Podman supports pods natively (analogous to Kubernetes pods) — groups of containers sharing a network namespace.

### Manage Pods
```bash
podman pod create --name mypod
podman pod create --name mypod -p 8080:80
podman pod ls
podman pod inspect mypod
podman pod start mypod
podman pod stop mypod
podman pod restart mypod
podman pod rm mypod
podman pod rm -f mypod           # Force remove (stops and removes)
podman pod prune                 # Remove all stopped pods
```
Create and manage pods.

### Add Containers to a Pod
```bash
podman run -d --pod mypod --name frontend nginx
podman run -d --pod mypod --name backend myapp:latest
podman pod ps                    # List pods and their containers
```
Run containers inside a pod so they share the same network stack.

### Pod Stats
```bash
podman pod stats mypod
podman pod top mypod
```
Monitor resource usage inside a pod.

---

## Rootless Containers

Podman runs rootless by default — no root daemon required.

```bash
# Verify rootless mode
podman info --format "{{.Host.Security.Rootless}}"

# Rootless storage location (per-user)
~/.local/share/containers/storage

# Fix subUID/subGID mappings if needed
cat /etc/subuid   # Should contain: <username>:100000:65536
cat /etc/subgid

# Re-initialize user namespace mappings
podman system migrate
```

### Running Privileged Operations Rootlessly
```bash
podman run --userns=keep-id <image>        # Map host UID into container
podman run --cap-add NET_ADMIN <image>     # Add a specific capability
podman run --privileged <image>            # Full privilege (use sparingly)
```

---

## Podman Compose

Podman supports Docker Compose files via `podman-compose` or the native `podman compose` plugin.

### Basic Usage
```bash
podman compose up -d              # Start services in background
podman compose up --build         # Rebuild images then start
podman compose down               # Stop and remove containers/networks
podman compose down -v            # Also remove volumes
podman compose ps                 # List service containers
podman compose logs -f            # Follow logs from all services
podman compose logs -f <service>  # Follow logs from one service
podman compose exec <service> sh  # Shell into a service container
podman compose pull               # Pull latest images
podman compose restart <service>  # Restart a specific service
```
Manage multi-container applications defined in `docker-compose.yml` / `compose.yaml`.

### Example compose.yaml
```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html:Z
    depends_on:
      - api

  api:
    build:
      context: ./api
      dockerfile: Containerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://db:27017/myapp
    depends_on:
      - db

  db:
    image: docker.io/library/mongo:7
    volumes:
      - dbdata:/data/db

volumes:
  dbdata:
```

---

## Generating Kubernetes YAML

Podman can generate Kubernetes-compatible manifests from running containers or pods.

```bash
# Generate a Kubernetes Pod manifest
podman generate kube mypod > mypod.yaml
podman generate kube mycontainer > mycontainer.yaml

# Play (apply) a Kubernetes YAML manifest with Podman
podman play kube mypod.yaml

# Tear down resources created by play kube
podman play kube --down mypod.yaml
```
Use `podman generate kube` to export local containers/pods to Kubernetes YAML, then deploy with `podman play kube` or `kubectl apply`.

---

## Systemd Integration (Auto-start Containers)

### Generate a Systemd Unit File
```bash
# Generate unit file for a container
podman generate systemd --new --name mycontainer > ~/.config/systemd/user/mycontainer.service

# Enable and start as a user service
systemctl --user daemon-reload
systemctl --user enable --now mycontainer.service
systemctl --user status mycontainer.service

# System-wide (root) service
sudo podman generate systemd --new --name mycontainer > /etc/systemd/system/mycontainer.service
sudo systemctl daemon-reload
sudo systemctl enable --now mycontainer.service
```
Run containers as systemd-managed services that start on boot.

### Quadlet (Podman 4.4+, recommended)
```ini
# ~/.config/containers/systemd/myapp.container
[Unit]
Description=My Application

[Container]
Image=docker.io/myuser/myapp:latest
PublishPort=8080:80
Volume=mydata.volume:/data:Z
Environment=NODE_ENV=production

[Service]
Restart=always

[Install]
WantedBy=default.target
```
```bash
systemctl --user daemon-reload
systemctl --user start myapp.service
```
Quadlet is the modern, declarative approach to running Podman containers as systemd units.

---

## Registries and Authentication

### Configure Registries
```bash
# /etc/containers/registries.conf (system) or
# ~/.config/containers/registries.conf (user)

# Search registries in order:
unqualified-search-registries = ["docker.io", "quay.io", "registry.access.redhat.com"]
```

### Login and Logout
```bash
podman login docker.io
podman login quay.io -u myuser -p mypassword
podman login --tls-verify=false registry.local:5000
podman logout docker.io
podman logout --all
```
Authenticate against container registries.

### Inspect Credentials
```bash
podman login --get-login docker.io     # Show logged-in username
cat ${XDG_RUNTIME_DIR}/containers/auth.json  # Rootless auth file
```

---

## System Management

### System Info and Disk Usage
```bash
podman info                        # Full system information
podman info --format json          # JSON output
podman system df                   # Disk usage by images/containers/volumes
podman system df -v                # Verbose disk usage breakdown
```

### Cleanup
```bash
podman system prune                # Remove stopped containers, dangling images, unused networks
podman system prune -a             # Also remove unused images (not just dangling)
podman system prune -a --volumes   # Also remove unused volumes (destructive!)
```

### Reset Podman (nuclear option)
```bash
podman system reset                # Remove ALL containers, images, pods, volumes
```
Resets Podman to a clean state — use with caution.

### Events
```bash
podman events                      # Stream real-time events
podman events --filter event=start
podman events --since 1h
```
Monitor container lifecycle events.

---

## Tips and Best Practices

### Use `:Z` for SELinux Volume Mounts
On systems with SELinux enforcing (RHEL, Fedora, CentOS), always add `:Z` to volume mounts so Podman relabels the volume for container access:
```bash
podman run -v ./data:/app/data:Z myapp
```

### Prefer Rootless Operation
Running rootless improves security — container processes map to your unprivileged UID on the host, limiting blast radius if a container is compromised.

### Use Named Volumes Over Bind Mounts for Persistence
```bash
# Prefer this (named volume)
podman run -v mydata:/app/data myapp

# Over this (bind mount) for portable deployments
podman run -v /home/user/data:/app/data myapp
```

### Image Naming: Always Qualify the Registry
Avoid ambiguous short names to prevent pull errors:
```bash
# Preferred
podman pull docker.io/library/nginx:alpine
podman pull quay.io/fedora/fedora:40

# Avoid (requires unqualified-search-registries to be configured)
podman pull nginx
```

### Clean Up Regularly
```bash
# Weekly cleanup alias
alias podman-clean='podman container prune -f && podman image prune -f && podman volume prune -f'
```

### Check Image Vulnerabilities
```bash
podman image scan <image>    # Requires podman-desktop or Trivy integration
trivy image <image>          # Standalone Trivy scanner
```

---

## Common Patterns

### Run a One-Off Command in a Fresh Container
```bash
podman run --rm -it python:3.12-slim python
podman run --rm -v $(pwd):/work -w /work node:20-alpine npm install
```

### Inspect a Stopped Container's Filesystem
```bash
podman create --name temp myimage
podman mount temp            # Returns mount path
ls $(podman mount temp)/app
podman umount temp
podman rm temp
```

### Debug a Failing Container
```bash
# Override entrypoint to get a shell
podman run --rm -it --entrypoint /bin/sh myapp:latest

# Run with extra privileges for debugging
podman run --rm -it --cap-add SYS_PTRACE myapp:latest
```

### Use a Local Registry for Development
```bash
# Start a local registry
podman run -d -p 5000:5000 --name registry docker.io/library/registry:2

# Tag and push to local registry
podman tag myapp:latest localhost:5000/myapp:latest
podman push --tls-verify=false localhost:5000/myapp:latest

# Pull from local registry
podman pull --tls-verify=false localhost:5000/myapp:latest
```

### Multi-Architecture Builds
```bash
podman build --platform linux/amd64,linux/arm64 -t myapp:latest .
podman manifest create myapp:multi-arch
podman manifest add myapp:multi-arch myapp:amd64
podman manifest add myapp:multi-arch myapp:arm64
podman manifest push myapp:multi-arch docker.io/myuser/myapp:latest
```

---

## Podman vs Docker Quick Reference

| Concept | Docker | Podman |
|---|---|---|
| Daemon required | Yes (`dockerd`) | No |
| Root required | By default | No (rootless by default) |
| Compose | `docker compose` | `podman compose` |
| Pods | No native pods | Native pod support |
| Kubernetes YAML | Requires extra tools | `podman generate kube` |
| Systemd integration | Manual | `podman generate systemd` / Quadlet |
| Socket | `/var/run/docker.sock` | `/run/user/<uid>/podman/podman.sock` |
| Config dir | `~/.docker/` | `~/.config/containers/` |
| Storage dir | `/var/lib/docker/` | `~/.local/share/containers/storage/` |
