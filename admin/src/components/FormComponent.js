import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import MigrationHistoryModal from "./MigrationHistoryModal";

const FormComponent = () => {
  const [formData, setFormData] = useState({
    fromUrl: "",
    fromServerId: "",
    toServerId: "",
    contentType: "",
  });
  const [serverUrls, setServerUrls] = useState([]);
  const [contentTypeUUIDs, setcontentTypeUUIDs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false); // Tracks if the user is authorized
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Function to handle password validation
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    try {
      const rawToken = sessionStorage.getItem("jwtToken");
      const token = rawToken ? rawToken.replace(/^"(.*)"$/, "$1") : null;

      if (!token) {
        // alert("Unauthorized: Please log in as an admin.");
        Swal.fire({
          icon: "error",
          title: "Unauthorized: Please log in as an admin.",
        });
        return;
      }

      const response = await fetch("/migrator/validate-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Login Successfull",
          timer: 1000,
          timerProgressBar: true,
        });
        setPassword("");
        setIsAuthorized(true); // Grant access
        setErrorMessage(""); // Clear any previous error messages
      } else {
        // setErrorMessage(data.message || "Invalid password.");
        Swal.fire({
          icon: "error",
          title: "Invalid Password",
          timer: 2000,
          timerProgressBar: true,
        });
        setPassword("");
      }
    } catch (error) {
      // setErrorMessage("An error occurred while validating the password.");
      Swal.fire({
        icon: "error",
        title: "An error occurred while validating the password.",
        timer: 2000,
        timerProgressBar: true,
      });
      setPassword("");
    }
  };

  useEffect(() => {
    if (!isAuthorized) return false;
    const fetchServerUrls = async () => {
      const rawToken = sessionStorage.getItem("jwtToken");
      const token = rawToken ? rawToken.replace(/^"(.*)"$/, "$1") : null;

      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized: Please log in as an admin.",
        });
        return;
      }

      const response = await fetch("/migrator/server-urls/get", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setServerUrls(data.serverUrls);
      } else {
        console.error("Failed to fetch server URLs");
      }
    };

    fetchServerUrls();
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchContentTypeUUID = async () => {
      const rawToken = sessionStorage.getItem("jwtToken");
      const token = rawToken ? rawToken.replace(/^"(.*)"$/, "$1") : null;

      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized: Please log in as an admin.",
        });
        return;
      }

      const response = await fetch("/migrator/content-types/get", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setcontentTypeUUIDs(data.contentTypes);
      } else {
        console.error("Failed to fetch server URLs");
      }
    };

    fetchContentTypeUUID();
  }, [isAuthorized]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trigger HTML5 validation
    const form = e.target;
    if (!form.checkValidity()) {
      e.stopPropagation(); // Prevent form submission
      form.classList.add("was-validated");
      return;
    }

    // If form is valid, show confirmation modal
    setShowModal(true);
  };

  const handleMigratorLogout = () => {
    setIsAuthorized(false);
  };

  const handleConfirmSubmit = async () => {
    try {
      // Retrieve the token from session storage
      const rawToken = sessionStorage.getItem("jwtToken");
      const token = rawToken ? rawToken.replace(/^"(.*)"$/, "$1") : null;

      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized: Please log in as an admin.",
        });
        return;
      }

      Swal.fire({
        icon: "info",
        title: "Migrating Data...Please Wait..",
        showConfirmButton: false,
        showCloseButton: false,
        showCancelButton: false,
        allowOutsideClick: false,
      });
      const response = await fetch("/migrator/details/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Migration Completed Successfully!",
        });
      } else if (response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Forbidden: Admin privileges required.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error Migrating Data",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Migration Failed",
      });
    } finally {
      setShowModal(false); // Close the modal after submission
    }
  };

  // Render the password input form if not authorized
  if (!isAuthorized) {
    return (
      <div className="container mt-5">
        <div className="card shadow-sm p-4">
          <h2 className="text-center fw-bold mb-4">Migrator Login</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-2">
              <label htmlFor="password" className="form-label">
                Enter Password
              </label>
              <input
                title="Contact the Super Admin for Password😎"
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMessage && (
              <div className="alert alert-danger" role="alert">
                {errorMessage}
              </div>
            )}
            <div className="text-center">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <form
        className="needs-validation"
        noValidate
        onSubmit={handleSubmit} // Use custom handleSubmit to trigger validation
      >
        <div className="mb-4 text-right">
          <div className="text-right">
            <button
              onClick={handleMigratorLogout}
              type="submit"
              className="btn btn-primary"
            >
              Logout Migrator
            </button>
          </div>
        </div>
        {/* Title */}
        <div className="mb-4 text-center">
          <h2 className="fw-bold">The Migrator</h2>
          <p className="text-muted">
            Migrate Data and Assets from One Strapi Application to Another
          </p>
        </div>

        {/* Row: From Server and To Server */}
        <div className="row g-4">
          {/* From Server Section */}
          <div className="col-lg-6">
            <div className="card p-3 shadow-sm">
              <h5 className="fw-bold mb-3">Source Application Server</h5>
              <div className="mb-3">
                <label htmlFor="fromUrl" className="form-label">
                  From Server Base URL
                </label>
                <select
                  className="form-control"
                  id="fromUrl"
                  name="fromUrl"
                  value={formData.fromUrl}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a Server URL</option>
                  {serverUrls.map((url, index) => (
                    <option key={index} value={url}>
                      {url}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">
                  Please select a valid server URL.
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="fromServerId" className="form-label">
                  From Server Record ID
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="fromServerId"
                  name="fromServerId"
                  value={formData.fromServerId}
                  onChange={handleChange}
                  placeholder="Enter record ID"
                  required
                />
                <div className="invalid-feedback">
                  Please provide a server record ID.
                </div>
              </div>
            </div>
          </div>

          {/* To Server Section */}
          <div className="col-lg-6">
            <div className="card p-3 shadow-sm">
              <h5 className="fw-bold mb-3">This Application Server</h5>
              <div className="mb-3">
                <label htmlFor="toServerId" className="form-label">
                  This Server Record ID
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="toServerId"
                  name="toServerId"
                  value={formData.toServerId}
                  onChange={handleChange}
                  placeholder="Enter record ID"
                  required
                />
                <div className="invalid-feedback">
                  Please provide this server record ID.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Type Section */}
        <div className="card p-3 mt-4 shadow-sm">
          <h5 className="fw-bold mb-3">Content Type Configuration</h5>
          <div className="mb-3">
            <label htmlFor="contentType" className="form-label">
              Select Content Type
            </label>

            <select
              className="form-control"
              id="contentType"
              name="contentType"
              value={formData.contentType}
              onChange={handleChange}
              required
            >
              <option value="">Select a Content Type</option>
              {contentTypeUUIDs.map((data, index) => (
                <option key={index} value={data}>
                  {data}
                </option>
              ))}
            </select>
            <div className="invalid-feedback">
              Please select a content type.
            </div>
          </div>
          {/* <div className="form-check mt-4">
            <input
              type="checkbox"
              className="form-check-input"
              id="includeMedia"
              name="includeMedia"
              checked={formData.includeMedia}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="includeMedia">
              Include Media
            </label>
          </div> */}
        </div>

        {/* Submit Button */}
        <div className="text-center mt-4">
          <button type="submit" className="btn btn-primary btn-lg px-4">
            Start Migration
          </button>
        </div>
      </form>

      <button
        className="btn btn-primary"
        onClick={() => setShowHistoryModal(true)}
      >
        View Previous Migrations
      </button>

      <MigrationHistoryModal
        show={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* Modal for Confirmation */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Migration</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to migrate?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmSubmit}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormComponent;
