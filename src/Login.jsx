import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import QrScanner from "react-qr-scanner";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("");
  const [process, setProcess] = useState(true);
  const [rollnumber, setRollnumber] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [error, setError] = useState("");

  // Set rollnumber from location.state if provided
  useEffect(() => {
    if (location.state?.rollnumber) {
      setRollnumber(location.state.rollnumber);
    }
  }, [location.state]);

  const handleScan = (data) => {
    if (data) {
      const scannedRollNumber = data.text.split(",")[0];
      setRollnumber(scannedRollNumber);
      setShowQrScanner(false); // Automatically close QR scanner after successful scan
    }
  };

  const handleError = (err) => {
    setError("Error accessing the camera or scanning QR code.");
    console.error(err);
  };

  const captureAndVerify = async () => {
    setProcess(false); // Disable button
    setMessage(""); // Clear previous messages

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setMessage("Failed to capture image. Please try again.");
      setProcess(true);
      return;
    }

    try {
      // Convert base64 image to Blob
      const responseData = imageSrc.split(",")[1]; // Extract base64 part
      const blob = await fetch(`data:image/jpeg;base64,${responseData}`).then(
        (res) => res.blob()
      );

      // Prepare form data
      const formData = new FormData();
      formData.append("image", blob, "captured_image.jpg");
      formData.append("rollnumber", rollnumber);

      // Make API call
      const response = await axios.post(
        "http://localhost:5000/login",
        formData
      );
      const result = response.data;

      // Process the response
      const uname = result["name"];
      if (uname !== "Unknown" && uname !== "user not recognised") {
        localStorage.setItem("userLoggedIn", "true"); // Mark user as logged in
        localStorage.setItem("username", uname);

        // Navigate based on user type
        if (uname === "23BD1A056D") {
          navigate("/home", { state: { admin: uname } });
        } else {
          navigate("/user", { state: { result: result } });
        }
      } else {
        setMessage("Face not recognized.");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      if (error.response) {
        setMessage("Server error: " + error.response.data.error);
      } else {
        setMessage("Network error. Please check your connection.");
      }
    } finally {
      setProcess(true); // Enable button
    }
  };

  const previewStyle = {
    height: "300px",
    width: "100%",
    maxWidth: "400px",
    objectFit: "cover",
  };

  return (
    <div
      className="text-center"
      style={{
        maxWidth: "600px",
        margin: "auto",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        padding: "20px",
        borderRadius: "8px",
      }}
    >
      <h2 className="my-4">Login with Face Recognition</h2>

      <div style={{ width: "80%", margin: "0 auto" }}>
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ width: "100%", maxWidth: "800px", height: "auto" }}
          className="mb-3"
        />
      </div>

      <input
        type="text"
        placeholder="Enter Roll Number"
        value={rollnumber}
        onChange={(e) => setRollnumber(e.target.value)}
        className="form-control mb-3"
      />

      <button
        onClick={captureAndVerify}
        className="btn btn-primary me-2"
        disabled={!process}
      >
        {process ? "Capture and Verify" : "Processing..."}
      </button>

      <button
        onClick={() => setShowQrScanner(true)}
        className="btn btn-secondary"
      >
        Scan QR Code
      </button>

      {message && <p className="mt-2 text-danger">{message}</p>}

      {showQrScanner && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: "1050",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <span
              onClick={() => setShowQrScanner(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "20px",
                color: "#000",
              }}
            >
              &times;
            </span>
            <h4 className="text-center">Scan QR Code</h4>
            <QrScanner
              delay={200}
              style={previewStyle}
              onError={handleError}
              onScan={handleScan}
            />
            {error && <p className="text-danger mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
