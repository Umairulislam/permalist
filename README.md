# 📝 Permalist

Permalist is a full-stack Todo application where users can register, add, edit, and delete todos. The app supports Google and GitHub OAuth authentication and provides a sleek, responsive user interface with a dark color scheme.

## 💡 Features

- 🔒 Secure authentication with GitHub and Google OAuth
- 📝 Create, update, and delete todos
- 🌐 Fully responsive design
- 🎨 Dark mode support

## 🛠️ Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)  
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)  
![EJS](https://img.shields.io/badge/EJS-b4ca65?logo=ejs&logoColor=white)  
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)  
![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)  
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)  
![Passport.js](https://img.shields.io/badge/Passport.js-34E27A?logo=passport&logoColor=white)  
![Google OAuth](https://img.shields.io/badge/Google%20OAuth-EA4335?logo=google&logoColor=white)  
![GitHub OAuth](https://img.shields.io/badge/GitHub%20OAuth-181717?logo=github&logoColor=white)  


## 🚀 Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Umairulislam/permalist.git
   cd permalist
   ```

2. **Install dependencies**:

   ```bash
    npm install
   ```

3. **Set up environment variables:**:
   Create a `.env` file in the root directory and add the following environment variables:

   ```bash
    PG_USER=your_postgres_user
    PG_HOST=your_postgres_host
    PG_DATABASE=your_postgres_db
    PG_PASSWORD=your_postgres_password
    PG_PORT=your_postgres_port
    SESSION_SECRET=your_session_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

4. **Run the server**:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## 📚 Usage

1. **Home Page**: Provides a brief introduction and links to register or log in.

2. **Register/Login**: Sign up or log in using your email, Google, or GitHub account.

3. **Todos Page**: View, add, update, or delete your todos.

4. **Logout**: Click on the logout button to log out of your account.

## 📸 Screenshot

![Permalist](./public/images/permalist1.png)
![Permalist](./public/images/permalist2.png)
![Permalist](./public/images/permalist3.png)
![Permalist](./public/images/permalist4.png)

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## 👨‍💼 Author

Crafted with care by **Engr. Umair Ul Islam**
