# Cloud Code

Cloud Code is a cloud-based development environment that allows users to write, run, and interact with their code in real time. 
It uses container-based code execution and dynamic deployment through Kubernetes.


## Features ✨

- **Cloud-Based IDE** with syntax highlighting & error detection
- **Real-Time Collaboration** via WebSockets
- **Isolated Kubernetes Pods** per project
- **Integrated Terminal** with PTY support
- **File Management** with S3 synchronization
- **Authentication System** (JWT-based)
- **Dynamic Project Routing** (`{username}-{replid}.example.com`)
- **Multi-Language Support** via base templates

## System Architecture 🏗️

### Backend Services

#### 1. Init Service
**Tech Stack**: Express.js, MongoDB, AWS SDK
- **Responsibilities**:
  - User authentication (Signup/Signin)
  - Project initialization
  - S3 template management
  - JWT token generation

#### 2. Runner Service
**Tech Stack**: Express-WS, Node-PTY, Socket.IO
- **Key Components**:
  - WebSocket server for real-time updates
  - File sync service (local ↔ S3)
  - PTY terminal management
  - Container lifecycle management

#### 3. Orchestrator Service
**Tech Stack**: Kubernetes Client, YAML
- **Functions**:
  - Dynamic pod creation/deletion
  - Service configuration
  - Namespace management
  - Ingress rule updates

#### 4. K8s Service
**Tech Stack**: NGINX Ingress Controller
- **Features**:
  - Traffic routing based on subdomains
  - SSL termination
  - Load balancing
  - Security policies

### Frontend
**Tech Stack**: React, Redux, Xterm.js, Monaco Editor
- **Components**:
  - Code Editor (Monaco)
  - Terminal Emulator (Xterm)
  - File Explorer
  - Collaboration Panel
  - Authentication UI


## Key Technologies 🔑

| Component          | Technology                          |
|--------------------|-------------------------------------|
| Container Runtime  | Kubernetes + Docker                 |
| Storage            | AWS S3                              |
| Real-Time          | WebSockets/Socket.IO                |
| Terminal           | Xterm.js + node-pty                 |
| Editor             | Monaco Editor                       |
| Auth               | JWT + Cookie Sessions               |
| CI/CD              | Kubernetes Manifests                |

## Security Measures 🔒

1. **Pod Isolation**: Each user session runs in separate Kubernetes namespace
2. **Network Policies**: Restrict inter-pod communication
3. **JWT Validation**: Token verification for all WebSocket connections
4. **S3 IAM Policies**: Bucket access restricted per user
5. **Ingress Validation**: Strict hostname routing rules

## Getting Started 🚀

### Prerequisites

- Kubernetes cluster
  (minikube for local but note that you need domain for routing and ingress ip should be exposed over internet to setp up DNS record *.example.com)
- AWS S3 bucket with templates
- MongoDB instance
- Node.js v18+

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/cloud-code.git
   cd cloud-code
   ```

2. **Configure Environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Install Dependencies**
   ```bash
   # Backend services
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

4. **Start Services**
   ```bash
   # Init Service
   cd backend/init-service && npm start

   # Orchestrator
   cd backend/orchestrator && npm start

   # Frontend
   cd frontend && npm run dev
   ```

5. **Deploy Kubernetes Components**
   ```bash
   kubectl create namespace ingress-nginx
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```

## Development Flow 🔄

1. User signs up/in via frontend
2. Init service creates project skeleton in S3
3. Orchestrator creates Kubernetes resources
4. Runner service initializes container
5. Frontend connects via WebSocket:
   - Editor ↔ File Service
   - Terminal ↔ PTY Service
6. All changes sync to S3 periodically

## Xterm Integration 🖥️

The terminal interface uses:
- **xterm.js**: Browser-based terminal emulator
- **xterm-addon-fit**: Auto-resize functionality
- **node-pty**: Pseudoterminal backend


## Monitoring & Logging 📊

- **Kubernetes Dashboard**: Pod health monitoring
- **Prometheus+Grafana**: Metrics collection
- **S3 Access Logs**: File change tracking
- **MongoDB Auditing**: Auth attempts logging

## Contributing 🤝

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request


---

**Happy Coding!** ^_^ 
