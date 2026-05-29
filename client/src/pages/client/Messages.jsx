import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import messageService from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

const Messages = () => {
  const { user } = useAuth();
  
  // State
  const [messages, setMessages] = useState([]);
  const [type, setType] = useState('Support Query');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await messageService.getClientMessages();
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load message history:', err);
      setErrorMsg('Could not fetch message history. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await messageService.sendMessage(type, message);
      if (res.success) {
        setSuccessMsg('Message dispatched to the advisory desk.');
        setMessage('');
        setType('Support Query');
        // Refresh message list
        const updated = await messageService.getClientMessages();
        if (updated.success) {
          setMessages(updated.data);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setErrorMsg('Failed to deliver message. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <span className="badge badge-status approved">Resolved</span>;
      case 'Replied':
        return <span className="badge badge-status pending bg-primary-subtle text-primary">Replied</span>;
      default:
        return <span className="badge badge-status pending">Pending</span>;
    }
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <Navbar />

      <div className="container py-4 text-start">
        <PageHeader
          title="Consultation Desk"
          subtitle="Submit query tickets or audit confirmations to your wealth advisor"
        />

        {errorMsg && (
          <div className="alert alert-danger py-2.5 small d-flex justify-content-between align-items-center mb-4">
            <span>{errorMsg}</span>
            <button className="btn btn-link p-0 text-danger text-decoration-none btn-sm" onClick={fetchMessages}>
              Retry
            </button>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success py-2.5 small mb-4">
            {successMsg}
          </div>
        )}

        <div className="row g-4 animate-fade">
          {/* Left Column: Create Message */}
          <div className="col-lg-4">
            <Card title="New Advisory Request">
              {user?.status === 'Pending' && (
                <div className="alert alert-warning py-2 small mb-3">
                  <i className="bi bi-clock-history me-1"></i>
                  KYC pending review. Advisors will process queries post verification.
                </div>
              )}

              <form onSubmit={handleSend}>
                <div className="mb-3">
                  <label className="form-label">Request Type</label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="Support Query">Support Query</option>
                    <option value="Withdrawal Request">Withdrawal Request</option>
                    <option value="Deposit Confirmation">Deposit Confirmation</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Message Details</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Provide details about your query..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 mt-2"
                  disabled={submitting || !message.trim()}
                >
                  {submitting ? 'Sending Request...' : 'Dispatch Request'}
                </button>
              </form>
            </Card>
          </div>

          {/* Right Column: History */}
          <div className="col-lg-8">
            <Card title="Historical Inquiry Tickets">
              {loading ? (
                <Loader message="Fetching historical tickets..." />
              ) : messages.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <i className="bi bi-chat-right-text fs-1 mb-2 d-block text-muted"></i>
                  No support tickets logged.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 text-start">
                    <thead>
                      <tr className="table-light">
                        <th className="ps-3 border-0">Date</th>
                        <th className="border-0">Type</th>
                        <th className="border-0">Message</th>
                        <th className="border-0">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map((msg) => (
                        <React.Fragment key={msg._id}>
                          <tr>
                            <td className="ps-3 text-secondary small" style={{ whiteSpace: 'nowrap' }}>
                              {formatDate(msg.createdAt)}
                            </td>
                            <td>
                              <span className="fw-semibold small text-primary">{msg.type}</span>
                            </td>
                            <td>
                              <div className="small text-dark text-break" style={{ maxWidth: '300px' }}>
                                {msg.message}
                              </div>
                            </td>
                            <td>{getStatusBadge(msg.status)}</td>
                          </tr>
                          {/* Nested reply block if present */}
                          {msg.reply && (
                            <tr className="bg-light-subtle">
                              <td colSpan="4" className="ps-4 border-0 py-2">
                                <div className="p-3 border-start border-primary border-3 bg-light rounded-1">
                                  <span className="small d-block text-secondary fw-semibold mb-1">
                                    Advisor Response:
                                  </span>
                                  <span className="small text-dark text-break">{msg.reply}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
