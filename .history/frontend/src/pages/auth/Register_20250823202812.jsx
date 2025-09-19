```jsx
   import React, { useState } from "react";
   import { useNavigate, Link } from "react-router-dom";
   import { useAuth } from "../../context/useAuth";
   import { UserPlus } from "lucide-react";
   import { motion } from "framer-motion";
   import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
   import FacebookLogin from "react-facebook-login";

   const Register = () => {
     const { login } = useAuth();
     const navigate = useNavigate();
     const [form, setForm] = useState({ username: "", password: "" });

     const handleSubmit = (e) => {
       e.preventDefault();
       login({ username: form.username, role: "user" });
       navigate("/");
     };

     const handleGoogleSuccess = async (response) => {
       try {
         const res = await fetch("/api/auth/google/callback", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ token: response.credential }),
         });
         const data = await res.json();
         if (data.success) {
           login({ username: data.user.username, role: data.user.role });
           navigate("/");
         } else {
           console.error("Google register failed:", data.message);
         }
       } catch (error) {
         console.error("Google register error:", error);
       }
     };

     const handleFacebookResponse = async (response) => {
       if (response.accessToken) {
         try {
           const res = await fetch("/api/auth/facebook/callback", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ accessToken: response.accessToken }),
           });
           const data = await res.json();
           if (data.success) {
             login({ username: data.user.username, role: data.user.role });
             navigate("/");
           } else {
             console.error("Facebook register failed:", data.message);
           }
         } catch (error) {
           console.error("Facebook register error:", error);
         }
       }
     };

     return (
       <div className="container d-flex justify-content-center align-items-center min-vh-100">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="card p-4 col-12 col-md-6 col-lg-4"
         >
           <div className="text-center mb-4">
             <UserPlus size={40} className="text-primary mx-auto" />
             <h3 className="fw-bold">Đăng ký</h3>
           </div>
           <form onSubmit={handleSubmit}>
             <div className="mb-3">
               <input
                 type="text"
                 className="form-control"
                 placeholder="Tên đăng nhập"
                 value={form.username}
                 onChange={(e) => setForm({ ...form, username: e.target.value })}
                 required
               />
             </div>
             <div className="mb-3">
               <input
                 type="password"
                 className="form-control"
                 placeholder="Mật khẩu"
                 value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })}
                 required
               />
             </div>
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               type="submit"
               className="btn btn-primary w-100"
             >
               Đăng ký
             </motion.button>
           </form>
           <div className="text-center my-3">
             <p className="text-muted">Hoặc đăng ký bằng</p>
             <div className="d-flex flex-column gap-2">
               <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
                 <GoogleLogin
                   onSuccess={handleGoogleSuccess}
                   onError={() => console.error("Google register error")}
                   text="signup_with"
                 />
               </GoogleOAuthProvider>
               <FacebookLogin
                 appId="YOUR_FACEBOOK_APP_ID"
                 fields="name,email,picture"
                 callback={handleFacebookResponse}
                 cssClass="btn btn-social facebook w-100"
                 textButton="Đăng ký với Facebook"
               />
             </div>
           </div>
           <p className="text-center mt-3 text-muted">
             Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
           </p>
         </motion.div>
       </div>
     );
   };

   export default Register;
   ```