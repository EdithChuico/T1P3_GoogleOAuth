import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useState } from "react";

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleGoogleSuccess = async (credentialResponse) => {

        try {
            setLoading(true);
            const decodedGoogleToken = jwtDecode(
                credentialResponse.credential
            );
            const response = await api.post("/auth/google/callback", {
                email: decodedGoogleToken.email,
                name: decodedGoogleToken.name
            });
            localStorage.setItem("token", response.data.token);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            setError("No fue posible iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div
            className="min-vh-100 d-flex justify-content-center align-items-center"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb)" }}
        >
            <div
                className="card border-0 shadow-lg" style={{ width: "420px", borderRadius: "20px" }}>
                <div className="card-body p-5">
                    <div className="text-center">
                        <div
                            className="rounded-circle bg-primary bg-gradient d-inline-flex justify-content-center align-items-center mb-4"
                            style={{ width: "80px", height: "80px", fontSize: "35px", color: "white" }}
                        >
                            <i className="bi bi-shield-lock-fill"></i>
                        </div>
                        <h2 className="fw-bold">
                            Northwind System
                        </h2>
                        <p className="text-secondary mb-4">
                            Plataforma de Gestión Empresarial
                        </p>
                    </div>
                    {error && (
                        <div className="alert alert-danger">
                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                            {error}
                        </div>
                    )}
                    <div className="text-center mb-4">
                        <small className="text-muted">
                            Accede utilizando tu cuenta institucional de Google.
                        </small>
                    </div>
                    <div className="d-flex justify-content-center">
                        {loading ? (
                            <div className="text-center">
                                <div
                                    className="spinner-border text-primary mb-3"
                                    role="status"
                                >
                                    <span className="visually-hidden">
                                        Loading...
                                    </span>
                                </div>
                                <p className="text-muted">
                                    Iniciando sesión...
                                </p>
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() =>
                                    setError("Error al conectar con Google.")
                                }
                            />
                        )}
                    </div>
                    <hr className="my-4" />
                    <div className="text-center">
                        <small className="text-muted">
                            <i className="bi bi-shield-check me-2"></i>
                            Autenticación segura mediante OAuth 2.0 y JWT
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Login;