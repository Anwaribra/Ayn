# Ayn Platform — Horus  
### Educational Quality Assurance & Accreditation SaaS 
Ayn is a modern SaaS platform built for educational institutions in Egypt to manage, track, and improve their quality standards and accreditation readiness.

The first major component of the platform is **Horus**, a dedicated module for educational quality assurance and compliance aligned with national and international standards.



##  Supported Quality Frameworks

Horus helps institutions align with:

- **ISO 21001** – Management systems for educational organizations  
- **ISO 9001** – Quality management systems  
- **NAQAAE (Egypt)** – National accreditation & educational quality  
<!-- - **NCAAA (Saudi Arabia)** – Academic accreditation   -->
- Institution-specific internal standards  


##  Problem Statement

Educational institutions often face challenges such as:

- Disorganized documents & evidence  
- Difficulty tracking internal/external audits  
- Complex criteria for quality and accreditation  
- Manual or outdated assessment workflows  
- Reviewer management and feedback tracking  
- Lack of clear dashboards to measure progress  

**Horus centralizes everything into one unified, easy-to-use system.**


##  Core Features

### 1. Standards Management
- Add ISO and NAQAAE standards  
- Add/edit criteria & sub-criteria  
- Assign standards to institutions  
- Standards versioning (future)

### 2. Assessments
- Create assessment cycles  
- Fill criteria responses  
- Save as draft  
- Submit for review  
- Reviewer comments  
- Workflow: **Draft → Submitted → Reviewed**

### 3. Evidence Management
- Upload evidence files (PDF, images, docs)  
- Link evidence to specific criteria  
- Track upload activity  
- Organized, searchable repository  

### 4. Dashboard & Insights
- Compliance percentage  
- Assessment progress  
- Evidence tracking  
- User activity  
- Institution-level overview  

### 5. User Roles
- **Platform Admin**  
- **Institution Admin**  
- **Teacher / Staff**  
- **Reviewer** (internal/external)

### 6. Institution Management
- Add/manage institutions  
- Add programs/departments  
- Assign users & roles  
- Activate/deactivate institutions  

### 7. Notifications
- In-app notifications  
- (Future: Email/SMS)

<!-- ### 8. SaaS Model
- Multi-institution architecture  
- Subscription per institution  
- (Future: Paymob / Fawry integration) -->



##  Architecture Overview

Ayn is designed as a scalable SaaS system:

### **Frontend**
- React
- TailwindCSS  
- shadcn/ui components  
- React Query  
- Zod validation  
- Full Arabic support (RTL & i18n)

### **Backend**
- Fast API
- JWT authentication  
- Role-based access  
- Prisma ORM  

### **Database**
- PostgreSQL  
- Optimized for standards, criteria, assessments, evidence, and institutions  

### **File Storage**
- Supabase Storage 

### **Deployment**
- Docker  
- AWS ECS / EC2 / Render  
- GitHub Actions CI/CD  

### **Monitoring**
- Application logs  
- Error tracking  
- Basic performance metrics  



<!-- ##  Egypt-Specific Considerations

- Full Arabic UI (RTL)  
- Aligned with NAQAAE accreditation frameworks  
- Pricing adapted for educational institutions  
- Optional local hosting in MENA region  
- Payment gateways (Paymob, Fawry) in future   -->



##  Why This Project Matters

- Schools in Egypt must adopt quality and accreditation systems  
- ISO 21001 adoption is increasing  
- NAQAAE standards require structured digital documentation  
- No modern Arabic SaaS currently serves this niche  
- Perfect for B2B (schools, centers, academies, universities)  
- Easily scalable internationally  

---


