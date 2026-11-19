This is a starter backend API built with Node.js, TypeScript, Express, TypeORM, and MySQL. It includes basic user CRUD, input checking with Joi, error handling, logging with Winston, security setup, and database migrations and seeders so I can build on it for bigger projects and the Final Project.

Features
•	User CRUD routes (get all with paging and sorting, get by ID, create, update, delete) and /health check
•	Input checking using Joi for body, params, and query
•	Custom error types and one central error handler so errors look the same
•	Logging with Winston to console and log files (logs/combined.log and logs/error.log)
•	Security stuff like Helmet, CORS, rate limit, body size limit, and hashing passwords with bcrypt
•	Checking .env values when the app starts using Joi
•	Database migrations (synchronize: false) and a seeder script for default users

Setup Instructions
•	Create the project folder, open it in VS Code, run npm init -y, and install the required packages (express, typeorm, mysql2, reflect-metadata, dotenv, joi, helmet, cors, express-rate-limit, winston, bcrypt, uuid, plus the TypeScript and @types packages)
•	Create the folders (src/config, src/controllers, src/services, src/entities, src/dto, src/middleware, src/utils, src/routes, src/migrations, src/seeds, logs, and tests) and set up tsconfig.json and package.json scripts
•	Copy .env.example to .env and fill in your MySQL settings (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE)
•	Open MySQL Workbench, connect to your local MySQL server, and run CREATE DATABASE boilerplate_db;
•	Run npm run migration:run to create the tables, run npm run seed to add the sample users, and run npm run dev to start the server 

Environment Variables
•	PORT — port number for the server (default is 3000)
•	DB_HOST — where MySQL is hosted, usually localhost
•	DB_PORT — MySQL port, usually 3306
•	DB_USERNAME — your MySQL username, like root
•	DB_PASSWORD — your MySQL password
•	DB_DATABASE — the database name, which is boilerplate_db
•	FRONTEND_URL — the frontend URL allowed by CORS (default is http://localhost:4200)
•   JWT_SECRET — secret key (at least 32 characters) used to sign and verify JWT tokens
•   JWT_EXPIRES_IN — token expiration time (default is 24h)

API Endpoints
•	GET /health — checks if the server is up and connected to the database
•	GET /api/users — gets a list of users (supports page, limit, sort, and order query params)
•	GET /api/users/:id — gets one user by their id
•	POST /api/users — creates a new user with name, email, password, and optional age
•	PUT /api/users/:id — updates a user's info (name, email, age, or isActive) by id
•	DELETE /api/users/:id — deletes a user by id

 Authentication Flow
- A user sends emai land  password to POST /api/auth/login.
- Joi checks that the email is valid and the password meets length rules.
- AuthService finds the user in MySQL (including the password column), checks that isActive is true, and compares the password against the stored hash using bcrypt.compare().
- If valid, the server signs a JWT with userId and email using JWT_SECRET and JWT_EXPIRES_IN, then returns the token and basic user info.
- For protected routes, the client sends Authorization: Bearer token in the request headers.
- authMiddleware extracts and verifies the token, attaches { userId, email } to req.user, and calls next(), or returns 401 Unauthorized if missing, invalid, or expired.

Migrations and Seeders
•	Generate a migration (when you change an entity):npm run migration:generate -- src/migrations/InitialSchema
•	Run migrations (creates/updates tables in MySQL):npm run migration:run
•	Undo the last migration (if needed):npm run migration:revert
•	Run seeders (adds the default users to the database): npm run seed 


Reflection Answers:

1.	What was the most challenging part of building this boilerplate? How did you overcome it? Getting the database connection, .env settings, and migration/seed commands to work together without running into missing packages or small syntax mistakes was the hardest part. I fixed it by checking MySQL Workbench, fixing each file step by step, and running the commands one at a time.
2.	How does this boilerplate differ from your Midterm project? What specific improvements did you make? This one has cleaner folders and separates the code into routes, controllers, services, DTOs, entities, and middleware instead of mixing everything together. I also added Joi validation, centralized error handling, Winston log files, security middleware, and migrations/seeders.
3.	Why is centralized error handling better than try-catch in every controller? Putting try-catch in every controller repeats a lot of code and can make error responses look different everywhere. Using one main error handler keeps error replies consistent and handles errors in one place.
4.	How does request validation with Joi improve security and code quality? Joi checks incoming data before it reaches the service or database, blocking bad inputs or extra unwanted fields early. That keeps the code cleaner because controllers and services can expect valid data.
5.	What's the difference between synchronize: true and migrations? Why are migrations essential for production?synchronize: true changes tables automatically when entities change, which can mess up or delete data by accident. Migrations keep track of database changes step by step, which is much safer for production.
6.	How does structured logging (Winston) help in production debugging compared to console.log?console.log only shows text in the terminal and goes away when the app restarts. Winston saves organized logs with timestamps and levels into files (combined.log and error.log), making it easier to see what went wrong.
7.	If you had to add a new feature (e.g., Product CRUD), how would you use this boilerplate? What would you need to add? I would follow the same setup as Users by adding a Product entity and migration, a product.dto.ts validation file, productService.ts, productController.ts, and productRoutes.ts, then hook up the route in src/index.ts.
8.	What additional features would you add to make this boilerplate even more production-ready? I would add login/authentication (like JWT and roles), more tests, API docs, and Docker setup so it is easier to run and deploy.



Reflection Answers #9
9. What is the difference between authentication and authorization? Give a real-world example of each. Authentication is checking who you are like logging in with email and password, while authorization is checking what you can do like an admin being allowed to delete users while a regular user can't.
10. Why is JWT considered "stateless" and how does that benefit scalability? The server doesn't store session state or look up a session store on every request because the token carries the data and signature. That makes scaling across servers easier since any server instance can verify the token.
11. What are the three parts of a JWT token and what does each part do? The three parts are the header (token type and algorithm), the payload user data like userId and email, and the signature checks that the token wasn't changed.
12. Why should you never put sensitive data (like passwords) in the JWT payload? The payload is Base64URL-encoded, not encrypted, so anyone who has the token can decode and read it. Putting passwords or secrets there would expose them.
13. How does bcrypt protect user passwords? What is the purpose of the "salt" and "rounds"? bcrypt hashes passwords slowly to make guessing harder. A salt is random data added before hashing so identical passwords don't produce the same hash, and rounds set how many hashing iterations are run.
14. What happens if someone steals a JWT token? How can you mitigate this risk? Someone with a stolen token can make requests as that user until it expires. You can reduce this risk by using shorter expiration times, using HTTPS, storing tokens safely, and adding refresh tokens or token revocation.
15. Why is it important to use HTTPS when transmitting JWT tokens? Without HTTPS, someone on the network can intercept the token while it's sent. HTTPS encrypts the connection so tokens stay safe in transit.
16. What is the difference between a short-lived access token and a long-lived refresh token? When would you use each? An access token is short-lived and sent on API requests to access protected routes, while a refresh token lasts longer and is used to get a new access token without logging in again. Short access tokens limit risk if stolen, and refresh tokens keep sessions convenient.
17. How does the auth middleware know which user is making the request? It reads the Bearer token from the Authorization header, verifies it with AuthService.verifyToken(), and attaches the decoded user data userId and email to req.user.
18. If you had to implement role-based authorization (e.g., admin vs. regular user), how would you modify your current setup? I would add a role column to the User entity and migration, include role in the JWT payload, and add a middleware after authMiddleware that checks if the user's role is allowed on that route.