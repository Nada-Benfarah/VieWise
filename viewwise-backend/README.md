
# Project Setup Instructions

## Prerequisites

- Ensure Python, PostgreSQL, and other necessary dependencies are installed.
- Install project dependencies as listed in `requirements.txt` using `pip install -r requirements.txt`.
- Configure environment variables in the `.env` file as shown below.

## Directory Setup

To set up the required directories, create the following structure at the root of your project:

### 1. Static Files

- **Static Root**: `static/` at the project root.
- **App-Specific Static Directories**: Within `static/`, create a subdirectory for each app.

Example:
static/
├── app1/
│   └── static/
│       └── app1/
├── app2/
│   └── static/
│       └── app2/

### 2. Templates

- **Global Templates**: `templates/` directory at the project root for shared templates.
- **App-Specific Templates**: Each app should have its own `templates/` folder.

Example:
templates/                 # Global templates
app1/
└── templates/
    └── app1/              # Templates for app1
app2/
└── templates/
    └── app2/              # Templates for app2

### 3. Logs

- **Logs Directory**: Create `logs/` at the project root for application logs.

Example:
logs/
├── error.log              # Error log file
├── info.log               # Info log file

### 4. Media Files

- **Media Root**: `media/` directory at the project root for user-uploaded files.

Example:
media/

## Initial Setup

### 1. Database Migration

To set up the database:

python manage.py makemigrations

python manage.py migrate

### 2. Create a Superuser

Create an admin account for the Django admin interface:

python manage.py createsuperuser

### 3. Install Requirements

Make sure to install all required dependencies:

### 4. Collect Static Files (for Production)

When deploying to production, run the following command to collect all static files:

python manage.py collectstatic --noinput

## Starting the Project

Run the project using the following command:

python manage.py runserver