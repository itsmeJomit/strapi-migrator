import React, { useState, useEffect } from "react";

const MigrationHistoryModal = ({ show, onClose }) => {
  const [migrationHistory, setMigrationHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 5;

  const fetchMigrationHistory = async (page) => {
    try {
      const rawToken = sessionStorage.getItem("jwtToken");
      const token = rawToken ? rawToken.replace(/^"(.*)"$/, "$1") : null;

      if (!token) {
        alert("Unauthorized: Please log in as an admin.");
        return;
      }

      const response = await fetch(
        `/migrator/migrations?page=${page}&pageSize=${itemsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMigrationHistory(data.data || []);
        setPageCount(data.meta.pagination.pageCount);
        setTotalRecords(data.meta.pagination.total);
      } else {
        console.error("Failed to fetch migration history");
      }
    } catch (error) {
      console.error("Error fetching migration history:", error);
    }
  };

  useEffect(() => {
    if (show) {
      fetchMigrationHistory(currentPage);
    }
  }, [show, currentPage]);

  const handlePageChange = (page) => {
    if (page > 0 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {show && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Migration History</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                ></button>
              </div>
              <div className="modal-body">
                {migrationHistory.length === 0 ? (
                  <p>No migrations have been performed yet.</p>
                ) : (
                  <>
                    {/* Table for Migration History */}
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>From URL</th>
                          <th>From ID</th>
                          <th>To ID</th>
                          <th>Content Type</th>
                          <th>Status</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {migrationHistory.map((migration, index) => (
                          <tr key={migration.id}>
                            <td>
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td>{migration.fromUrl}</td>
                            <td>{migration.fromRecordId}</td>
                            <td>{migration.toRecordId}</td>
                            <td>{migration.contentType}</td>
                            <td>
                              <span
                                className={`badge ${
                                  migration.status === "Completed"
                                    ? "bg-success"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {migration.status}
                              </span>
                            </td>
                            <td>
                              {new Date(migration.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="d-flex justify-content-between align-items-center">
                      <p>
                        Page {currentPage} of {pageCount} ({totalRecords} total
                        records)
                      </p>
                      <div>
                        <button
                          className="btn btn-outline-primary me-2"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          disabled={currentPage === pageCount}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MigrationHistoryModal;
