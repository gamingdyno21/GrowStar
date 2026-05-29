import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import messageService from '../../services/messageService';
import { formatDate } from '../../utils/helpers';

const MessagesPanel = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // sync every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await messageService.getAdminMessages();
      if (res.success) {
        setMessages(res.data);
        
        // Update active selection to pick up replies / updates
        if (selectedMessage) {
          const current = res.data.find(m => m._id === selectedMessage._id);
          if (current) setSelectedMessage(current);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin messages list:', err);
      setErrorMsg('Could not load client message records.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    setSubmitting(true);
    try {
      const res = await messageService.replyMessage(selectedMessage._id, replyText);
      if (res.success) {
        setReplyText('');
        fetchMessages();
      }
    } catch (err) {
      alert('Failed to save response.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveClick = async (ticketId) => {
    if (!ticketId) return;
    console.log("Resolving ticket:", ticketId);
    if (!window.confirm('Mark this request ticket as resolved?')) return;
    setErrorMsg('');
    try {
      const res = await messageService.resolveMessage(ticketId);
      if (res.success) {
        await fetchMessages();
        // Update selectedMessage state to transition badge from Pending/Replied to Resolved
        if (selectedMessage && selectedMessage._id === ticketId) {
          setSelectedMessage(prev => ({ ...prev, status: 'Resolved' }));
        }
      } else {
        setErrorMsg(res.message || 'Failed to update ticket status.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update ticket status.');
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
    <div className="container-fluid p-0 bg-light min-vh-100">
      <div className="row g-0">
        {/* Sidebar Column */}
        <div className="col-12 col-md-3 col-xl-2 d-flex flex-column">
          <Sidebar />
        </div>

        {/* Content Column */}
        <div className="col-12 col-md-9 col-xl-10 p-4 text-start">
          <PageHeader
            title="Messages Center"
            subtitle="Review client advisory queries, deposit confirmations, and withdrawal requests"
          />

          {errorMsg && <div className="alert alert-danger py-2.5 small mb-3">{errorMsg}</div>}

          {loading ? (
            <Loader message="Loading support inbox..." />
          ) : (
            <div className="row g-4 animate-fade">
              {/* Left pane: Messages table */}
              <div className="col-lg-7 col-xl-8">
                <Card title={`Client Tickets (${messages.length})`}>
                  {messages.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-mailbox fs-1 mb-2 d-block text-muted"></i>
                      No inquiries received.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 text-start">
                        <thead>
                          <tr className="table-light">
                            <th className="ps-3 border-0">Client Name</th>
                            <th className="border-0">Message</th>
                            <th className="border-0">Date</th>
                            <th className="border-0">Status</th>
                            <th className="text-end pe-3 border-0">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {messages.map((msg) => (
                            <tr
                              key={msg._id}
                              className={selectedMessage?._id === msg._id ? 'table-primary-subtle' : ''}
                            >
                              <td className="ps-3 fw-semibold text-dark">
                                {msg.userId?.fullName || 'Anonymous / purger'}
                                <span className="d-block small text-secondary fw-normal">
                                  {msg.userId?.email || 'N/A'}
                                </span>
                              </td>
                              <td>
                                <div className="small fw-semibold text-primary">{msg.type}</div>
                                <div className="small text-secondary text-truncate" style={{ maxWidth: '200px' }}>
                                  {msg.message}
                                </div>
                              </td>
                              <td className="text-secondary small">{formatDate(msg.createdAt)}</td>
                              <td>{getStatusBadge(msg.status)}</td>
                              <td className="text-end pe-3">
                                <button
                                  className="btn btn-sm btn-outline-primary px-2.5 py-1 me-1"
                                  onClick={() => setSelectedMessage(msg)}
                                >
                                  View
                                </button>
                                {msg.status !== 'Resolved' && (
                                  <button
                                    className="btn btn-sm btn-outline-success px-2.5 py-1"
                                    onClick={() => handleResolveClick(msg._id)}
                                  >
                                    Resolve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right pane: View / Reply Details */}
              <div className="col-lg-5 col-xl-4">
                {selectedMessage ? (
                  <Card title="Ticket Dossier Details">
                    <div className="text-start">
                      <div className="mb-3 pb-2 border-bottom border-light">
                        <span className="text-secondary small d-block">Client Name</span>
                        <span className="fw-bold text-dark">{selectedMessage.userId?.fullName || 'N/A'}</span>
                        <span className="text-secondary small d-block">{selectedMessage.userId?.email || ''}</span>
                      </div>

                      <div className="row mb-3">
                        <div className="col-6">
                          <span className="text-secondary small d-block">Request Type</span>
                          <span className="badge bg-primary-subtle text-primary">{selectedMessage.type}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-secondary small d-block">Dispatched Date</span>
                          <span className="text-dark small fw-medium">{formatDate(selectedMessage.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mb-3 p-3 bg-light rounded-2 border">
                        <span className="text-secondary small d-block fw-semibold mb-1">Message Detail</span>
                        <p className="text-dark small mb-0 text-break" style={{ whiteSpace: 'pre-wrap' }}>
                          {selectedMessage.message}
                        </p>
                      </div>

                      {selectedMessage.reply && (
                        <div className="mb-4 p-3 bg-success-subtle rounded-2 border border-success-subtle">
                          <span className="text-success small d-block fw-semibold mb-1">Advisor Response Log</span>
                          <p className="text-dark small mb-0 text-break" style={{ whiteSpace: 'pre-wrap' }}>
                            {selectedMessage.reply}
                          </p>
                        </div>
                      )}

                      {selectedMessage.status === 'Resolved' ? (
                        <div className="alert alert-success py-2.5 small text-center mb-0">
                          <i className="bi bi-check-circle-fill me-1"></i> Resolved support case.
                        </div>
                      ) : (
                        <form onSubmit={handleReplySubmit} className="mt-3 border-top border-light pt-3">
                          <div className="mb-3">
                            <label className="form-label fw-semibold text-secondary small">
                              {selectedMessage.reply ? 'Update Response' : 'Write Support Response'}
                            </label>
                            <textarea
                              className="form-control"
                              rows="4"
                              placeholder="Type your reply here..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              disabled={submitting}
                              required
                            ></textarea>
                          </div>

                          <div className="d-flex gap-2">
                            <button
                              type="submit"
                              className="btn btn-primary flex-grow-1"
                              disabled={submitting || !replyText.trim()}
                            >
                              {submitting ? 'Submitting...' : 'Send Response'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => handleResolveClick(selectedMessage?._id)}
                              disabled={submitting || !selectedMessage}
                            >
                              Resolve
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </Card>
                ) : (
                  <div className="card text-center p-5 bg-white border-light shadow-sm">
                    <i className="bi bi-chat-text-fill text-muted display-4 mb-3"></i>
                    <h6 className="fw-bold text-primary">No Ticket Selected</h6>
                    <p className="text-secondary small mb-0">
                      Click the "View" button beside any client query row to inspect details, write replies, or resolve the ticket.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPanel;
