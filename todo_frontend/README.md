# Family Task Organizer - Playful Frontend

This project implements a fun, child-friendly dashboard for the Family Task Organizer. Features include themed role-based dashboards, user authentication, colorful draggable task cards, task templates, lookahead suggestions, motivational banners, and seamless REST API integration.

## Features

- **Authentication**: Signup and login for parents and kids (role-based).
- **Playful Dashboard**: Big cards, avatars, and illustrations for child-friendly task management.
- **Parent/Kid Views**: Parents can assign/check tasks for the family; kids see and update their own.
- **Task Templates**: For fast one-click entry of common family tasks.
- **Lookahead Suggestions**: Typing offers smart task suggestions.
- **Motivational Content**: Tips, banner, and progress stars!
- **Modern, Responsive UI**: Adapts to both desktop and mobile.

## Running the Frontend

Install dependencies and run:

```bash
npm install
npm start
```

By default, the frontend expects the backend running on `localhost:3001`. To use elsewhere, set:

```bash
REACT_APP_BACKEND_URL=http://<your-backend>:3001
```

## Development Notes

- UI and theme colors live in `src/App.css`.
- Main app/dashboard logic is in `src/App.js`.

See backend API docs for endpoint requirements and expected responses.
