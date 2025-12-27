# Kubernetes Command Cheat Sheet

## Quick Reference: Environment Switching

```bash
# Context (cluster) switching
kubectx                      # List all contexts
kubectx dev                  # Switch to dev context
kubectx -                    # Switch to previous context

# Namespace switching
kubens                       # List all namespaces
kubens development           # Switch to development namespace
kubens -                     # Switch to previous namespace

# Combined workflow
kubectx prod && kubens production    # Switch context and namespace
```

**For detailed multi-environment setup and configuration, see the "Multi-Environment Configuration" section below.**

---

## Basic Commands

### Cluster Info
```bash
kubectl cluster-info
```
Get information about the Kubernetes cluster.

### Nodes
```bash
kubectl get nodes
```
List all nodes in the cluster.

### Namespaces
```bash
kubectl get namespaces
kubectl create namespace <name>
kubectl delete namespace <name>
```
Manage namespaces.

## Workloads

### Pods
```bash
kubectl get pods
kubectl get pods -n <namespace>
kubectl describe pod <pod-name>
kubectl delete pod <pod-name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- /bin/bash
```
List, describe, delete, and access pods.

### Deployments
```bash
kubectl get deployments
kubectl describe deployment <deployment-name>
kubectl apply -f <file.yaml>
kubectl delete deployment <deployment-name>
```
Manage deployments.

### ReplicaSets
```bash
kubectl get replicasets
kubectl describe replicaset <replicaset-name>
kubectl delete replicaset <replicaset-name>
```
Work with ReplicaSets.

### Services
```bash
kubectl get services
kubectl describe service <service-name>
kubectl delete service <service-name>
```
Manage services.

## Configuration Management

### ConfigMaps
```bash
kubectl get configmaps
kubectl create configmap <name> --from-literal=<key>=<value>
kubectl describe configmap <name>
kubectl delete configmap <name>
```
Handle ConfigMaps.

### Secrets
```bash
kubectl get secrets
kubectl create secret generic <name> --from-literal=<key>=<value>
kubectl describe secret <name>
kubectl delete secret <name>
```
Manage Secrets.

## Persistent Storage

### PersistentVolume (PV)
```bash
kubectl get pv
kubectl describe pv <pv-name>
kubectl delete pv <pv-name>
```
Work with PersistentVolumes.

### PersistentVolumeClaim (PVC)
```bash
kubectl get pvc
kubectl describe pvc <pvc-name>
kubectl delete pvc <pvc-name>
```
Manage PersistentVolumeClaims.

### Check Mounted Volumes
```bash
kubectl get pods <pod-name> -o jsonpath='{.spec.volumes[*].name}'
kubectl describe pod <pod-name> | grep -i volume
kubectl exec -it <pod-name> -- mount | grep <volume-name>
```
Verify if a volume is mounted correctly by checking the pod's volume information and running `mount` inside the pod.

## Monitoring & Debugging

### Logs
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> -c <container-name>
```
Fetch logs from a pod or container.

### Describe
```bash
kubectl describe <resource> <resource-name>
```
Describe resource details.

### Events
```bash
kubectl get events
kubectl get events -n <namespace>
```
View events in the cluster.

## Scaling and Rollouts

### Scaling
```bash
kubectl scale deployment <deployment-name> --replicas=<number>
```
Scale a deployment.

### Rollouts
```bash
kubectl rollout status deployment <deployment-name>
kubectl rollout history deployment <deployment-name>
kubectl rollout undo deployment <deployment-name>
```
Manage deployment rollouts.

## Access Control

### Roles & RoleBindings
```bash
kubectl get roles -n <namespace>
kubectl get rolebindings -n <namespace>
```
View roles and role bindings.

### ClusterRoles & ClusterRoleBindings
```bash
kubectl get clusterroles
kubectl get clusterrolebindings
```
Manage cluster-wide roles and bindings.

## Miscellaneous

### Apply Configuration
```bash
kubectl apply -f <file.yaml>
```
Apply a configuration to a resource.

### Delete Resources
```bash
kubectl delete -f <file.yaml>
```
Delete resources defined in a file.

### Get Resource Details
```bash
kubectl get <resource>
kubectl get <resource> -o wide
kubectl get <resource> -o yaml
kubectl get <resource> -o json
```
Retrieve details about a resource in different formats.

### Run Command in Pod
```bash
kubectl exec -it <pod-name> -- <command>
```
Execute a command inside a pod.

### Port Forwarding
```bash
kubectl port-forward <pod-name> <local-port>:<remote-port>
```
Forward a local port to a pod.

### Proxy
```bash
kubectl proxy
```
Run a proxy to access the Kubernetes API server.

## Productivity Tips

### 1. Use Aliases and Shortcuts
Add to your `.bashrc` or `.zshrc`:
```bash
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kdel='kubectl delete'
alias kl='kubectl logs'
alias kex='kubectl exec -it'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
```

### 2. Enable kubectl Autocomplete
```bash
# Bash
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc

# Zsh
source <(kubectl completion zsh)
echo "source <(kubectl completion zsh)" >> ~/.zshrc

# With alias
complete -F __start_kubectl k
```

### 3. Set Default Namespace
```bash
kubectl config set-context --current --namespace=<your-namespace>
```
Avoid typing `-n namespace` every time.

### 4. Use kubens and kubectx
```bash
# Install kubectx (includes kubens)
brew install kubectx  # macOS
# or download from https://github.com/ahmetb/kubectx

# Switch context quickly
kubectx                    # List contexts
kubectx <context-name>     # Switch context
kubectx -                  # Switch to previous context

# Switch namespace quickly
kubens                     # List namespaces
kubens <namespace>         # Switch namespace
kubens -                   # Switch to previous namespace
```

**See the "Multi-Environment Configuration" section below for comprehensive setup guides, workflows, and advanced kubectx/kubens usage.**

### 5. Watch Resources in Real-Time
```bash
kubectl get pods -w
kubectl get pods --watch
watch kubectl get pods  # Traditional Unix watch
```

### 6. Wide Output for More Info
```bash
kubectl get pods -o wide
kubectl get nodes -o wide
kubectl get services -o wide
```
Shows more columns like IPs, nodes, etc.

### 7. Output Formats
```bash
kubectl get pods -o yaml          # Full YAML
kubectl get pods -o json          # Full JSON
kubectl get pods -o name          # Just names
kubectl get pods -o wide          # More columns
kubectl get pods -o jsonpath='{.items[*].metadata.name}'  # Custom
```

### 8. Get All Resources
```bash
kubectl get all                   # Most resources
kubectl get all -A                # All namespaces
kubectl api-resources             # List all resource types
```

### 9. Quick Pod Debugging
```bash
# Shell into first container
kubectl exec -it <pod-name> -- /bin/bash
# or if bash not available
kubectl exec -it <pod-name> -- /bin/sh

# Shell into specific container in multi-container pod
kubectl exec -it <pod-name> -c <container-name> -- /bin/bash

# Run one-off command
kubectl exec <pod-name> -- ls -la /app
```

### 10. Tail Logs Efficiently
```bash
kubectl logs -f <pod-name>                    # Follow logs
kubectl logs --tail=100 <pod-name>            # Last 100 lines
kubectl logs --since=1h <pod-name>            # Last hour
kubectl logs -f <pod-name> -c <container>     # Specific container
kubectl logs <pod-name> --previous            # Previous container (after crash)
kubectl logs -l app=myapp                     # All pods with label
```

### 11. Describe vs Get
```bash
# Get: Quick overview
kubectl get pod <pod-name>

# Describe: Detailed info + events
kubectl describe pod <pod-name>
```
Use `describe` when troubleshooting!

### 12. Edit Resources Live
```bash
kubectl edit deployment <name>
kubectl edit service <name>
```
Opens in your default editor. Changes apply immediately.

### 13. Quick Resource Creation from Command Line
```bash
# Create deployment
kubectl create deployment nginx --image=nginx

# Expose as service
kubectl expose deployment nginx --port=80 --type=LoadBalancer

# Create namespace
kubectl create namespace dev

# Create secret
kubectl create secret generic my-secret --from-literal=password=mysecret
```

### 14. Generate YAML Templates
```bash
kubectl create deployment nginx --image=nginx --dry-run=client -o yaml > deployment.yaml
kubectl create service clusterip my-service --tcp=80:80 --dry-run=client -o yaml > service.yaml
```

### 15. Use Labels and Selectors Effectively
```bash
# Get by label
kubectl get pods -l app=myapp
kubectl get pods -l environment=production,tier=frontend

# Delete by label
kubectl delete pods -l app=myapp

# Add label
kubectl label pods <pod-name> env=production

# Remove label
kubectl label pods <pod-name> env-
```

### 16. Port Forwarding for Local Access
```bash
# Forward pod port to localhost
kubectl port-forward <pod-name> 8080:80

# Forward service port
kubectl port-forward service/<service-name> 8080:80

# Background process
kubectl port-forward <pod-name> 8080:80 &
```

### 17. Copy Files To/From Pods
```bash
# Copy to pod
kubectl cp ./local-file <pod-name>:/path/in/pod

# Copy from pod
kubectl cp <pod-name>:/path/in/pod ./local-file

# Specific container
kubectl cp ./file <pod-name>:/path -c <container-name>
```

### 18. Resource Usage
```bash
# Node resource usage
kubectl top nodes

# Pod resource usage
kubectl top pods

# Pod resource usage in namespace
kubectl top pods -n <namespace>

# Pod resource usage with containers
kubectl top pods --containers
```

### 19. Rollout Management
```bash
# Update image
kubectl set image deployment/<name> <container>=<new-image>

# Check rollout status
kubectl rollout status deployment/<name>

# View rollout history
kubectl rollout history deployment/<name>

# Rollback to previous version
kubectl rollout undo deployment/<name>

# Rollback to specific revision
kubectl rollout undo deployment/<name> --to-revision=2

# Pause rollout
kubectl rollout pause deployment/<name>

# Resume rollout
kubectl rollout resume deployment/<name>
```

### 20. Quick Cluster Inspection
```bash
# Check cluster health
kubectl get componentstatuses

# Get cluster info
kubectl cluster-info dump

# Check API versions
kubectl api-versions

# Check resource limits
kubectl describe nodes | grep -A 5 "Allocated resources"
```

## Advanced Productivity Tips

### 21. JSONPath Queries
```bash
# Get all pod IPs
kubectl get pods -o jsonpath='{.items[*].status.podIP}'

# Get container images
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].image}'

# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP
```

### 22. Field Selectors
```bash
# Get running pods
kubectl get pods --field-selector=status.phase=Running

# Get pods on specific node
kubectl get pods --field-selector=spec.nodeName=<node-name>
```

### 23. Debugging Failed Pods
```bash
# Get pod events
kubectl get events --field-selector involvedObject.name=<pod-name>

# Get pod in all states
kubectl get pods --all-namespaces --field-selector=status.phase!=Running

# Previous logs (after crash)
kubectl logs <pod-name> --previous
```

### 24. Dry Run and Diff
```bash
# See what would change
kubectl apply -f deployment.yaml --dry-run=client

# Server-side dry run
kubectl apply -f deployment.yaml --dry-run=server

# Diff before applying
kubectl diff -f deployment.yaml
```

### 25. Using kubectl run for Quick Testing
```bash
# Temporary debug pod
kubectl run debug --image=busybox --rm -it --restart=Never -- sh

# Test network connectivity
kubectl run curl --image=curlimages/curl --rm -it --restart=Never -- curl http://service-name

# Run with specific commands
kubectl run nginx --image=nginx --command -- sleep 3600
```

## Troubleshooting Workflows

### Pod Not Starting
```bash
kubectl get pods                    # Check status
kubectl describe pod <pod-name>     # Check events
kubectl logs <pod-name>             # Check logs
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Service Not Accessible
```bash
kubectl get svc                     # Check service
kubectl describe svc <svc-name>     # Check endpoints
kubectl get endpoints <svc-name>    # Check if pods are registered
kubectl run curl --rm -it --image=curlimages/curl -- curl http://<service-name>
```

### High Resource Usage
```bash
kubectl top nodes
kubectl top pods --all-namespaces
kubectl describe node <node-name>   # Check resource allocation
```

### Image Pull Issues
```bash
kubectl describe pod <pod-name> | grep -A 10 Events
kubectl get events | grep "Failed to pull image"
```

## Multi-Environment Configuration

### Understanding Kubernetes Contexts

A **context** in Kubernetes combines three elements:
- **Cluster**: The Kubernetes cluster API endpoint
- **User**: Authentication credentials
- **Namespace**: Default namespace for operations

### Setting Up Multiple Environments

#### 1. Manual Context Configuration

```bash
# Add a cluster
kubectl config set-cluster dev-cluster \
  --server=https://dev-k8s-api.example.com:6443 \
  --certificate-authority=/path/to/ca.crt

kubectl config set-cluster staging-cluster \
  --server=https://staging-k8s-api.example.com:6443 \
  --certificate-authority=/path/to/ca.crt

kubectl config set-cluster prod-cluster \
  --server=https://prod-k8s-api.example.com:6443 \
  --certificate-authority=/path/to/ca.crt

# Add user credentials
kubectl config set-credentials dev-user \
  --token=<dev-token>

kubectl config set-credentials staging-user \
  --client-certificate=/path/to/staging-client.crt \
  --client-key=/path/to/staging-client.key

kubectl config set-credentials prod-user \
  --client-certificate=/path/to/prod-client.crt \
  --client-key=/path/to/prod-client.key

# Create contexts (cluster + user + namespace)
kubectl config set-context dev \
  --cluster=dev-cluster \
  --user=dev-user \
  --namespace=development

kubectl config set-context staging \
  --cluster=staging-cluster \
  --user=staging-user \
  --namespace=staging

kubectl config set-context prod \
  --cluster=prod-cluster \
  --user=prod-user \
  --namespace=production

# Set current context
kubectl config use-context dev
```

#### 2. Using Separate Kubeconfig Files

```bash
# Set KUBECONFIG environment variable to use multiple configs
export KUBECONFIG=~/.kube/config:~/.kube/dev-config:~/.kube/prod-config

# Or merge configs into one
KUBECONFIG=~/.kube/config:~/.kube/dev-config kubectl config view --flatten > ~/.kube/merged-config
mv ~/.kube/merged-config ~/.kube/config
```

#### 3. Cloud Provider CLI Tools

```bash
# AWS EKS
aws eks update-kubeconfig --name dev-cluster --region us-east-1 --alias dev
aws eks update-kubeconfig --name prod-cluster --region us-east-1 --alias prod

# Google GKE
gcloud container clusters get-credentials dev-cluster --zone us-central1-a --project my-project
gcloud container clusters get-credentials prod-cluster --zone us-central1-a --project my-project

# Azure AKS
az aks get-credentials --resource-group dev-rg --name dev-cluster --context dev
az aks get-credentials --resource-group prod-rg --name prod-cluster --context prod

# DigitalOcean
doctl kubernetes cluster kubeconfig save dev-cluster
doctl kubernetes cluster kubeconfig save prod-cluster
```

### Installing kubectx and kubens

#### Installation Methods

```bash
# macOS with Homebrew
brew install kubectx

# Linux with package manager
sudo apt install kubectx    # Debian/Ubuntu
sudo yum install kubectx    # RHEL/CentOS

# Manual installation
sudo git clone https://github.com/ahmetb/kubectx /opt/kubectx
sudo ln -s /opt/kubectx/kubectx /usr/local/bin/kubectx
sudo ln -s /opt/kubectx/kubens /usr/local/bin/kubens

# With shell completion
# Bash
git clone https://github.com/ahmetb/kubectx.git ~/.kubectx
echo 'export PATH=~/.kubectx:$PATH' >> ~/.bashrc
source ~/.kubectx/completion/kubectx.bash
source ~/.kubectx/completion/kubens.bash

# Zsh
mkdir -p ~/.oh-my-zsh/custom/plugins/kubectx
git clone https://github.com/ahmetb/kubectx.git ~/.oh-my-zsh/custom/plugins/kubectx
# Add kubectx to plugins in ~/.zshrc
```

### Using kubectx for Context Switching

```bash
# List all contexts
kubectx

# Switch to a specific context
kubectx dev
kubectx staging
kubectx prod

# Switch to previous context
kubectx -

# Show current context
kubectx -c

# Rename a context
kubectx new-name=old-name

# Delete a context
kubectx -d context-name

# Create an alias for a context
kubectx dev=arn:aws:eks:us-east-1:123456789:cluster/dev-cluster
```

### Using kubens for Namespace Switching

```bash
# List all namespaces in current context
kubens

# Switch to a specific namespace
kubens development
kubens kube-system
kubens default

# Switch to previous namespace
kubens -

# Show current namespace
kubens -c
```

### Practical Multi-Environment Workflows

#### Workflow 1: Deploying to Different Environments

```bash
# Deploy to dev
kubectx dev
kubens development
kubectl apply -f deployment.yaml

# Verify deployment
kubectl get pods
kubectl logs -f deployment/myapp

# Deploy to staging
kubectx staging
kubens staging
kubectl apply -f deployment.yaml

# Deploy to production
kubectx prod
kubens production
kubectl apply -f deployment.yaml
```

#### Workflow 2: Checking Application Across Environments

```bash
# Create a script to check all environments
#!/bin/bash

for env in dev staging prod; do
    echo "=== Checking $env ==="
    kubectx $env
    kubectl get pods -n app-namespace
    kubectl get svc -n app-namespace
    echo ""
done

# Return to previous context
kubectx -
```

#### Workflow 3: Using Context-Specific Namespaces

```bash
# Set default namespaces for each context
kubectx dev
kubectl config set-context --current --namespace=development

kubectx staging
kubectl config set-context --current --namespace=staging

kubectx prod
kubectl config set-context --current --namespace=production

# Now when you switch contexts, the namespace is automatically set
kubectx dev
kubectl get pods  # Automatically uses 'development' namespace
```

### Example Multi-Environment Kubeconfig

Create `~/.kube/config` with this structure:

```yaml
apiVersion: v1
kind: Config
current-context: dev

clusters:
- cluster:
    certificate-authority: /path/to/ca.crt
    server: https://dev-api.example.com:6443
  name: dev-cluster
- cluster:
    certificate-authority: /path/to/ca.crt
    server: https://staging-api.example.com:6443
  name: staging-cluster
- cluster:
    certificate-authority: /path/to/ca.crt
    server: https://prod-api.example.com:6443
  name: prod-cluster

users:
- name: dev-user
  user:
    token: dev-token-here
- name: staging-user
  user:
    client-certificate: /path/to/staging-client.crt
    client-key: /path/to/staging-client.key
- name: prod-user
  user:
    client-certificate: /path/to/prod-client.crt
    client-key: /path/to/prod-client.key

contexts:
- context:
    cluster: dev-cluster
    user: dev-user
    namespace: development
  name: dev
- context:
    cluster: staging-cluster
    user: staging-user
    namespace: staging
  name: staging
- context:
    cluster: prod-cluster
    user: prod-user
    namespace: production
  name: prod
```

### Shell Integration for Better Context Awareness

#### Add Context to Your Prompt

```bash
# For Bash (~/.bashrc)
function kube_context() {
    local context=$(kubectx -c 2>/dev/null)
    local namespace=$(kubens -c 2>/dev/null)
    if [ -n "$context" ]; then
        echo " ☸️  $context:$namespace"
    fi
}
export PS1='[\u@\h \W$(kube_context)]\$ '

# For Zsh (~/.zshrc) - Using Oh My Zsh
# Add 'kubectl' to plugins
plugins=(git kubectl kubectx)

# Or manually
function kube_prompt() {
    local context=$(kubectx -c 2>/dev/null)
    local namespace=$(kubens -c 2>/dev/null)
    if [ -n "$context" ]; then
        echo " ☸️  $context:$namespace"
    fi
}
RPROMPT='$(kube_prompt)'

# Using kube-ps1 (recommended)
# Install: brew install kube-ps1
source "/usr/local/opt/kube-ps1/share/kube-ps1.sh"
PS1='[\u@\h \W $(kube_ps1)]\$ '
```

### Environment-Specific Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Quick context switches
alias kdev='kubectx dev && kubens development'
alias kstaging='kubectx staging && kubens staging'
alias kprod='kubectx prod && kubens production'

# Environment-aware kubectl commands
alias kdev-pods='kubectx dev && kubectl get pods -n development'
alias kstaging-pods='kubectx staging && kubectl get pods -n staging'
alias kprod-pods='kubectx prod && kubectl get pods -n production'

# Safety aliases for production
alias kprod-apply='kubectx prod && kubectl apply --dry-run=client -f'
alias kprod-delete='kubectx prod && kubectl delete --dry-run=client -f'
```

### Configuration Management Tips

#### 1. Keep Contexts Organized
```bash
# Use descriptive names
kubectl config rename-context old-name company-env-cluster

# Examples:
kubectx mycompany-dev-us-east
kubectx mycompany-prod-us-west
kubectx mycompany-prod-eu-west
```

#### 2. Backup Your Kubeconfig
```bash
# Regular backups
cp ~/.kube/config ~/.kube/config.backup.$(date +%Y%m%d)

# Version control (without secrets)
# Store cluster/context structure, but not credentials
kubectl config view --minify --flatten > kubeconfig-template.yaml
```

#### 3. Use KUBECONFIG Environment Variable
```bash
# Switch between complete config sets
export KUBECONFIG=~/.kube/work-config     # Work clusters
export KUBECONFIG=~/.kube/personal-config # Personal clusters

# Add to shell profile for persistent setting
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
```

#### 4. Verify Before Destructive Operations
```bash
# Always check context before destructive operations
kubectl config current-context
kubectx -c
kubens -c

# Or create a wrapper function
function safe-kubectl() {
    local context=$(kubectx -c)
    local namespace=$(kubens -c)
    echo "Context: $context, Namespace: $namespace"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl "$@"
    fi
}

# Use for critical operations
alias k-delete='safe-kubectl delete'
```

### Troubleshooting Multi-Environment Setup

#### Context Not Found
```bash
# List all contexts
kubectl config get-contexts

# View full config
kubectl config view

# Validate specific context
kubectl config use-context <context-name> && kubectl cluster-info
```

#### Authentication Issues
```bash
# Test connection
kubectl --context=<context-name> get nodes

# Check credentials
kubectl config view --minify --flatten

# Re-authenticate
# AWS
aws eks update-kubeconfig --name <cluster-name>

# GCP
gcloud container clusters get-credentials <cluster-name>

# Azure
az aks get-credentials --name <cluster-name> --resource-group <rg>
```

#### Namespace Not Found
```bash
# List all namespaces
kubectl get namespaces

# Create missing namespace
kubectl create namespace <namespace-name>

# Update context with correct namespace
kubectl config set-context --current --namespace=<namespace-name>
```

### Best Practices for Multi-Environment Management

1. **Use Consistent Naming**: Name contexts and namespaces consistently across environments
   - Example: `company-dev`, `company-staging`, `company-prod`

2. **Set Default Namespaces**: Configure default namespaces for each context to avoid mistakes

3. **Color-Code Environments**: Use shell prompts with colors to distinguish environments
   - Dev: Green
   - Staging: Yellow  
   - Production: Red

4. **Require Confirmation for Production**: Add shell aliases that require confirmation for prod operations

5. **Separate Credentials**: Use different credentials/service accounts for each environment

6. **Document Access**: Maintain documentation of who has access to which environments

7. **Regular Audits**: Periodically review and clean up unused contexts

8. **Use RBAC**: Implement proper Role-Based Access Control for each environment

9. **Test Context Switching**: Regularly test your context switching to ensure it works

10. **Backup Configs**: Keep backups of your kubeconfig files

### Practical Scripts for Environment Management

#### Multi-Environment Status Script

Save as `k8s-status.sh`:

```bash
#!/bin/bash

# Check status across all environments
ENVIRONMENTS=("dev" "staging" "prod")
NAMESPACES=("development" "staging" "production")

for i in "${!ENVIRONMENTS[@]}"; do
    env="${ENVIRONMENTS[$i]}"
    ns="${NAMESPACES[$i]}"
    
    echo "======================================"
    echo "Environment: $env (namespace: $ns)"
    echo "======================================"
    
    # Switch context
    kubectx "$env" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Context switched to $env"
        
        # Get pods
        echo -e "\nPods:"
        kubectl get pods -n "$ns" --no-headers | wc -l | xargs echo "  Total pods:"
        kubectl get pods -n "$ns" --field-selector=status.phase=Running --no-headers | wc -l | xargs echo "  Running:"
        
        # Get deployments
        echo -e "\nDeployments:"
        kubectl get deployments -n "$ns" --no-headers 2>/dev/null | wc -l | xargs echo "  Total:"
        
        # Get services
        echo -e "\nServices:"
        kubectl get svc -n "$ns" --no-headers 2>/dev/null | wc -l | xargs echo "  Total:"
        
        # Check for failed pods
        failed=$(kubectl get pods -n "$ns" --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | wc -l)
        if [ "$failed" -gt 0 ]; then
            echo -e "\n⚠️  Warning: $failed pod(s) not running"
            kubectl get pods -n "$ns" --field-selector=status.phase!=Running,status.phase!=Succeeded
        fi
    else
        echo "❌ Failed to switch to context $env"
    fi
    
    echo -e "\n"
done

# Return to previous context
kubectx - > /dev/null 2>&1
```

#### Safe Production Deploy Script

Save as `k8s-prod-deploy.sh`:

```bash
#!/bin/bash

# Safe production deployment with checks
set -e

CONTEXT="prod"
NAMESPACE="production"
MANIFEST_FILE="$1"

if [ -z "$MANIFEST_FILE" ]; then
    echo "Usage: $0 <manifest-file>"
    exit 1
fi

if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: File $MANIFEST_FILE not found"
    exit 1
fi

echo "================================================"
echo "🚨 PRODUCTION DEPLOYMENT 🚨"
echo "================================================"
echo "Context: $CONTEXT"
echo "Namespace: $NAMESPACE"
echo "Manifest: $MANIFEST_FILE"
echo "================================================"
echo ""

# Switch to production context
kubectx "$CONTEXT"

# Verify context
CURRENT_CONTEXT=$(kubectx -c)
if [ "$CURRENT_CONTEXT" != "$CONTEXT" ]; then
    echo "❌ Failed to switch to $CONTEXT context"
    exit 1
fi

echo "✅ Context verified: $CURRENT_CONTEXT"
echo ""

# Show what will be applied
echo "📋 Resources to be deployed:"
kubectl apply -f "$MANIFEST_FILE" --dry-run=client -n "$NAMESPACE"
echo ""

# Show diff
echo "📊 Changes to be made:"
kubectl diff -f "$MANIFEST_FILE" -n "$NAMESPACE" || true
echo ""

# Confirmation
read -p "Do you want to proceed with deployment? (yes/no): " -r
echo ""

if [ "$REPLY" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Second confirmation for production
read -p "Are you absolutely sure? Type 'deploy to production': " -r
echo ""

if [ "$REPLY" != "deploy to production" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Deploy
echo "🚀 Deploying to production..."
kubectl apply -f "$MANIFEST_FILE" -n "$NAMESPACE"

echo ""
echo "✅ Deployment initiated"
echo ""

# Watch rollout if it's a deployment
RESOURCE_TYPE=$(kubectl get -f "$MANIFEST_FILE" -n "$NAMESPACE" -o jsonpath='{.kind}' 2>/dev/null | tr '[:upper:]' '[:lower:]')
RESOURCE_NAME=$(kubectl get -f "$MANIFEST_FILE" -n "$NAMESPACE" -o jsonpath='{.metadata.name}' 2>/dev/null)

if [ "$RESOURCE_TYPE" = "deployment" ]; then
    echo "👀 Watching rollout status..."
    kubectl rollout status deployment/"$RESOURCE_NAME" -n "$NAMESPACE" --timeout=5m
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo ""
        echo "📊 Current pods:"
        kubectl get pods -n "$NAMESPACE" -l app="$RESOURCE_NAME"
    else
        echo ""
        echo "⚠️  Rollout did not complete successfully"
        echo "Check with: kubectl rollout status deployment/$RESOURCE_NAME -n $NAMESPACE"
    fi
fi

echo ""
echo "================================================"
echo "Deployment complete"
echo "================================================"
```

#### Environment Comparison Script

Save as `k8s-compare.sh`:

```bash
#!/bin/bash

# Compare resource versions across environments
RESOURCE_TYPE="$1"
RESOURCE_NAME="$2"

if [ -z "$RESOURCE_TYPE" ] || [ -z "$RESOURCE_NAME" ]; then
    echo "Usage: $0 <resource-type> <resource-name>"
    echo "Example: $0 deployment myapp"
    exit 1
fi

ENVIRONMENTS=("dev:development" "staging:staging" "prod:production")

echo "Comparing $RESOURCE_TYPE/$RESOURCE_NAME across environments"
echo "=========================================="
echo ""

for env_ns in "${ENVIRONMENTS[@]}"; do
    IFS=':' read -r env ns <<< "$env_ns"
    
    echo "--- $env ($ns) ---"
    kubectx "$env" > /dev/null 2>&1
    
    # Get image version
    if [ "$RESOURCE_TYPE" = "deployment" ]; then
        IMAGE=$(kubectl get deployment "$RESOURCE_NAME" -n "$ns" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)
        REPLICAS=$(kubectl get deployment "$RESOURCE_NAME" -n "$ns" -o jsonpath='{.spec.replicas}' 2>/dev/null)
        
        if [ -n "$IMAGE" ]; then
            echo "  Image: $IMAGE"
            echo "  Replicas: $REPLICAS"
        else
            echo "  ❌ Not found"
        fi
    else
        kubectl get "$RESOURCE_TYPE" "$RESOURCE_NAME" -n "$ns" 2>/dev/null || echo "  ❌ Not found"
    fi
    
    echo ""
done
```

#### Quick Context Info Script

Save as `k8s-info.sh`:

```bash
#!/bin/bash

# Show current Kubernetes context information
CONTEXT=$(kubectx -c 2>/dev/null)
NAMESPACE=$(kubens -c 2>/dev/null)
CLUSTER=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}' 2>/dev/null)
SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' 2>/dev/null)

echo "📍 Current Kubernetes Environment"
echo "=================================="
echo "Context:   $CONTEXT"
echo "Namespace: $NAMESPACE"
echo "Cluster:   $CLUSTER"
echo "Server:    $SERVER"
echo "=================================="

# Quick stats
echo ""
echo "📊 Quick Stats:"
PODS=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l | xargs)
RUNNING=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l | xargs)
DEPLOYMENTS=$(kubectl get deployments -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l | xargs)
SERVICES=$(kubectl get svc -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l | xargs)

echo "  Pods:        $RUNNING/$PODS running"
echo "  Deployments: $DEPLOYMENTS"
echo "  Services:    $SERVICES"

# Add to your shell profile for quick access:
# alias k8s-info='~/scripts/k8s-info.sh'
```

Make scripts executable:
```bash
chmod +x k8s-status.sh k8s-prod-deploy.sh k8s-compare.sh k8s-info.sh
```

Add to your shell profile:
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/scripts:$PATH"

alias k8s-status='k8s-status.sh'
alias k8s-deploy-prod='k8s-prod-deploy.sh'
alias k8s-compare='k8s-compare.sh'
alias k8s-info='k8s-info.sh'
```

## Best Practices

1. **Always use namespaces**: Organize resources logically
2. **Label everything**: Makes selection and filtering easy
3. **Use declarative configs**: YAML files in version control
4. **Set resource limits**: Prevent resource exhaustion
5. **Use health checks**: liveness and readiness probes
6. **Version control manifests**: Track changes with Git
7. **Use kubectl diff**: Preview changes before applying
8. **Monitor resource usage**: Regular `kubectl top` checks
9. **Clean up resources**: Delete unused pods, services, deployments
10. **Use RBAC properly**: Principle of least privilege

This cheat sheet covers commonly used `kubectl` commands for managing Kubernetes clusters, workloads, configuration, storage, monitoring, and more. Adjust `<placeholders>` with actual values relevant to your environment.

