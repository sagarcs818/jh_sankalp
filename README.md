# 🚀 JH-SANKALP

### Smart India Hackathon | Smart Societal Challenge & Project Lifecycle Management Ecosystem

**JH-SANKALP** is an enterprise-grade, full-stack collaboration platform designed to connect **Citizens, Government Departments, Academic Institutions, and Industry CSR Partners** on a unified ecosystem.

The platform enables stakeholders to **report, track, analyze, prioritize, match, and resolve societal challenges** efficiently throughout the complete project lifecycle.

Built for the **Smart India Hackathon (SIH)**, JH-SANKALP addresses the need for integrated project lifecycle management and ecosystem-wide collaboration.

---

## 🌟 Key Features

### 🔐 Role-Based Access Control (RBAC)

Dedicated dashboards and secure workflows for different ecosystem stakeholders:

* 👤 **Citizens**
* 🏛️ **Government Officials**
* 🎓 **Universities / Academic Institutions**
* 🏢 **Industry & CSR Partners**

Each role receives access to features and information relevant to their responsibilities.

---

### 🗺️ Real-Time GIS Command Center

An interactive geospatial command center powered by **Leaflet and OpenStreetMap**.

**Citizen Features:**

* 📍 Drop incident/problem pins directly on the map
* 📝 Submit location-based societal issues
* 📌 Track reported incidents

**Government Features:**

* 🗺️ View incidents across the state
* 🔴 Color-coded incident visualization
* 📊 Monitor geographical problem distribution
* 🚨 Identify high-priority areas

---

### 🤖 Automated Triage & AI Priority

Incoming citizen reports can be categorized according to their urgency and importance.

Priority levels include:

* 🔴 **Critical**
* 🟠 **High**
* 🟡 **Medium**

The triage system helps government officials quickly identify and address the most important societal challenges.

---

### 📊 Visual Analytics Engine

Interactive dashboards provide real-time insights into project and issue management.

Analytics include:

* 📈 Project resolution funnels
* 📊 Category-wise issue distribution
* 📍 Geographical distribution
* 🚨 Priority-based analytics
* 📋 Project lifecycle tracking

Visualization is implemented using **Recharts**.

---

### 🎓 Academic Smart Match

JH-SANKALP intelligently connects government challenges with suitable academic institutions.

The matching process considers:

* 🧪 Laboratory infrastructure
* 🎯 Domain expertise
* 🏫 Institutional capabilities
* 💡 Technical requirements of the challenge

This allows suitable challenges to be routed to universities that have the required expertise and infrastructure.

---

### 🤝 Industry & CSR Collaboration

Industry and CSR partners can participate in the ecosystem by supporting suitable projects and societal initiatives.

Potential collaboration areas include:

* 💰 CSR funding
* 🛠️ Technical support
* 👨‍💻 Industry expertise
* 🏗️ Infrastructure support
* 🤝 Project partnerships

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────────┐
                    │        JH-SANKALP        │
                    │   Collaboration Platform │
                    └────────────┬─────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
       ┌───────────┐       ┌────────────┐      ┌────────────┐
       │  Citizen  │       │ Government │      │ University │
       └─────┬─────┘       └──────┬─────┘      └──────┬─────┘
             │                    │                   │
             └────────────────────┼───────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   React / Vite  │
                         │   Frontend      │
                         └────────┬────────┘
                                  │
                              REST API
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Django + DRF    │
                         │ Backend         │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ SQLite Database │
                         └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology          | Purpose                         |
| ------------------- | ------------------------------- |
| ⚛️ React.js         | Frontend application            |
| ⚡ Vite              | Development server & build tool |
| 🎨 Tailwind CSS     | UI styling                      |
| 🧭 React Router DOM | Client-side routing             |
| 🗺️ Leaflet         | Interactive maps                |
| 🌍 OpenStreetMap    | Map data                        |
| 📊 Recharts         | Data visualization              |
| 🧩 Lucide React     | Icons                           |

### Backend

| Technology               | Purpose                        |
| ------------------------ | ------------------------------ |
| 🐍 Python                | Backend programming language   |
| 🌐 Django                | Backend web framework          |
| 🔌 Django REST Framework | RESTful API development        |
| 🔑 JWT                   | Authentication & authorization |
| 🗄️ SQLite               | Development database           |
| 🐘 PostgreSQL            | Production database option     |

---

## 📁 Project Structure

```text
jh_sankalp/
│
├── frontend/                 # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/                  # Django backend (if applicable)
│   ├── manage.py
│   ├── ...
│
├── requirements.txt          # Python dependencies
├── manage.py                 # Django management script
├── README.md
└── ...
```

> **Note:** The exact directory structure may vary depending on the current repository organization.

---

# 🚀 Local Installation & Setup

Follow the steps below to run JH-SANKALP locally.

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/sagarcs818/jh_sankalp.git
cd jh_sankalp
```

---

# 🐍 2️⃣ Backend Setup — Django

### Create a Virtual Environment

```bash
python -m venv venv
```

### Activate the Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### macOS / Linux

```bash
source venv/bin/activate
```

---

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

### Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### Start the Django Server

```bash
python manage.py runserver
```

The backend will run at:

```text
http://127.0.0.1:8000/
```

---

# ⚛️ 3️⃣ Frontend Setup — React

Open a **new terminal window**.

Navigate to the frontend directory:

```bash
cd frontend
```

Install the required Node.js dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will generally be available at:

```text
http://localhost:5173
```

---

# 🌐 4️⃣ Access the Platform

Open your browser and visit:

```text
http://localhost:5173
```

You should now be able to access the JH-SANKALP platform.

---

# 🔑 Demo / Government Access

To access the **Government Dashboard**:

1. Click **Sign Up**
2. Select the **Government** role
3. Enter the required security clearance code:

```text
gov123
```

> ⚠️ **Security Note:** `gov123` is intended for local/demo use. Do not use a hard-coded clearance code like this in a production deployment. Store secrets securely using environment variables or a dedicated authentication/authorization system.

---

# 👥 User Roles

| Role              | Primary Responsibilities                               |
| ----------------- | ------------------------------------------------------ |
| 👤 Citizen        | Report and track societal issues                       |
| 🏛️ Government    | Review, prioritize, manage and resolve challenges      |
| 🎓 University     | Provide academic expertise and infrastructure          |
| 🏢 Industry / CSR | Provide funding, technology and implementation support |

---

# 🔄 Project Lifecycle

JH-SANKALP supports an integrated societal challenge lifecycle:

```text
Citizen Reports Issue
        ↓
Location & Category Detection
        ↓
Automated Triage
        ↓
Priority Assignment
        ↓
Government Review
        ↓
Academic Smart Match
        ↓
University / Industry Collaboration
        ↓
Project Implementation
        ↓
Progress Tracking
        ↓
Resolution
        ↓
Analytics & Impact Assessment
```

---

# 📊 Core Modules

### 👤 Citizen Module

* User registration & authentication
* Issue reporting
* GIS-based incident location
* Issue tracking
* Status updates

### 🏛️ Government Module

* Government dashboard
* GIS command center
* Incident monitoring
* Priority-based triage
* Project management
* Analytics
* Resolution tracking

### 🎓 University Module

* Institutional profile
* Domain expertise
* Laboratory infrastructure
* Challenge discovery
* Smart challenge matching
* Project collaboration

### 🏢 Industry / CSR Module

* CSR partner profile
* Project discovery
* Funding opportunities
* Technical collaboration
* Social impact participation

---

# 🔒 Security

JH-SANKALP uses several mechanisms to improve platform security:

* 🔑 JWT-based authentication
* 🛡️ Role-Based Access Control
* 🔐 Protected API endpoints
* 👥 Role-specific dashboards
* 🚫 Unauthorized route protection

For production deployment, additional security measures should be implemented, including:

* Environment-based secrets
* HTTPS
* Secure JWT configuration
* PostgreSQL
* API rate limiting
* Production CORS configuration
* Secure password policies

---

# 📈 Future Enhancements

Potential future improvements include:

* 🤖 Advanced AI-powered issue classification
* 🧠 Predictive analytics for emerging societal problems
* 📱 Progressive Web App / Mobile Application
* 🛰️ Advanced GIS heatmaps
* 🔔 Real-time notifications
* 📧 Email & SMS alerts
* 🔗 Blockchain-based project transparency
* 🐘 PostgreSQL production deployment
* ☁️ Cloud deployment
* 📊 Advanced impact measurement
* 🤝 Automated CSR project recommendations
* 🎓 Improved university-project recommendation engine

---

# 💡 Smart India Hackathon Alignment

JH-SANKALP is designed around the core objective of creating a **unified ecosystem for identifying and solving societal challenges**.

The platform brings together:

```text
Citizens
    +
Government
    +
Academia
    +
Industry / CSR
    ↓
Unified Collaboration Ecosystem
    ↓
Efficient Project Lifecycle Management
    ↓
Faster Problem Resolution
    ↓
Measurable Social Impact
```

This ecosystem-oriented approach enables different stakeholders to collaborate rather than operating in isolated systems.

---

# 🧪 Development

To build the frontend for production:

```bash
cd frontend
npm run build
```

The production build will be generated according to the Vite configuration.

For Django production deployment, configure:

* `DEBUG=False`
* Production `ALLOWED_HOSTS`
* Secure environment variables
* PostgreSQL database
* HTTPS
* Static/media file handling
* Production WSGI/ASGI server

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### Steps

```bash
# Fork the repository

# Clone your fork
git clone https://github.com/sagarcs818/jh_sankalp.git

# Create a new branch
git checkout -b feature/your-feature

# Make your changes

# Commit your changes
git add .
git commit -m "Add your feature"

# Push the branch
git push origin feature/your-feature
```

Then open a **Pull Request**.

---

# 🐛 Issues & Feedback

If you encounter a bug or have a feature request, please open an issue in the GitHub repository.

Repository:

https://github.com/sagarcs818/jh_sankalp

---

# 👨‍💻 Author

**Sagar CS**

Developed for the **Smart India Hackathon**.

GitHub:
https://github.com/sagarcs818

---

# 📜 License

This project is currently developed as a **Smart India Hackathon project**.

Add an appropriate open-source license such as **MIT**, **Apache-2.0**, etc., if you intend to distribute the project under an open-source license.

---

# ⭐ Support

If you find **JH-SANKALP** useful or interesting, consider giving the repository a ⭐ on GitHub!

```text
                 🚀 JH-SANKALP
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Citizens      Government     Academia
        │              │              │
        └──────────────┼──────────────┘
                       │
                    Industry
                       │
                       ▼
             🤝 COLLABORATION
                       │
                       ▼
              💡 SMART SOLUTIONS
                       │
                       ▼
                🌍 SOCIAL IMPACT
```

**Built with ❤️ for Smart India Hackathon**
