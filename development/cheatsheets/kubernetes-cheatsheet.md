# Kubernetes Command Cheat Sheet

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

This cheat sheet covers commonly used `kubectl` commands for managing Kubernetes clusters, workloads, configuration, storage, monitoring, and more. Adjust `<placeholders>` with actual values relevant to your environment.

