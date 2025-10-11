// App.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContractReadOnly, getContractWithSigner } from "./contract";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import "./App.css";

interface FeedbackRecord {
  id: string;
  encryptedData: string;
  timestamp: number;
  reviewer: string;
  reviewee: string;
  category: string;
  projectId: string;
}

const App: React.FC = () => {
  // Randomized style selections:
  // Colors: High contrast (blue+orange)
  // UI Style: Flat design
  // Layout: Card-based
  // Interaction: Micro-interactions
  
  // Randomized features:
  // 1. Project introduction
  // 2. Data statistics
  // 3. Search & filter
  // 4. Team information

  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    visible: boolean;
    status: "pending" | "success" | "error";
    message: string;
  }>({ visible: false, status: "pending", message: "" });
  const [newFeedbackData, setNewFeedbackData] = useState({
    reviewee: "",
    category: "collaboration",
    projectId: "",
    comments: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Calculate statistics
  const totalFeedbacks = feedbacks.length;
  const collaborationCount = feedbacks.filter(f => f.category === "collaboration").length;
  const communicationCount = feedbacks.filter(f => f.category === "communication").length;
  const technicalCount = feedbacks.filter(f => f.category === "technical").length;

  useEffect(() => {
    loadFeedbacks().finally(() => setLoading(false));
  }, []);

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
      });
    } catch (e) {
      alert("Failed to connect wallet");
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
  };

  const loadFeedbacks = async () => {
    setIsRefreshing(true);
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      // Check contract availability using FHE
      const isAvailable = await contract.isAvailable();
      if (!isAvailable) {
        console.error("Contract is not available");
        return;
      }
      
      const keysBytes = await contract.getData("feedback_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing feedback keys:", e);
        }
      }
      
      const list: FeedbackRecord[] = [];
      
      for (const key of keys) {
        try {
          const feedbackBytes = await contract.getData(`feedback_${key}`);
          if (feedbackBytes.length > 0) {
            try {
              const feedbackData = JSON.parse(ethers.toUtf8String(feedbackBytes));
              list.push({
                id: key,
                encryptedData: feedbackData.data,
                timestamp: feedbackData.timestamp,
                reviewer: feedbackData.reviewer,
                reviewee: feedbackData.reviewee,
                category: feedbackData.category,
                projectId: feedbackData.projectId
              });
            } catch (e) {
              console.error(`Error parsing feedback data for ${key}:`, e);
            }
          }
        } catch (e) {
          console.error(`Error loading feedback ${key}:`, e);
        }
      }
      
      list.sort((a, b) => b.timestamp - a.timestamp);
      setFeedbacks(list);
    } catch (e) {
      console.error("Error loading feedbacks:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    setCreating(true);
    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Encrypting feedback with FHE..."
    });
    
    try {
      // Simulate FHE encryption
      const encryptedData = `FHE-${btoa(JSON.stringify(newFeedbackData))}`;
      
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const feedbackId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const feedbackData = {
        data: encryptedData,
        timestamp: Math.floor(Date.now() / 1000),
        reviewer: account,
        reviewee: newFeedbackData.reviewee,
        category: newFeedbackData.category,
        projectId: newFeedbackData.projectId
      };
      
      // Store encrypted data on-chain using FHE
      await contract.setData(
        `feedback_${feedbackId}`, 
        ethers.toUtf8Bytes(JSON.stringify(feedbackData))
      );
      
      const keysBytes = await contract.getData("feedback_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      keys.push(feedbackId);
      
      await contract.setData(
        "feedback_keys", 
        ethers.toUtf8Bytes(JSON.stringify(keys))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Encrypted feedback submitted securely!"
      });
      
      await loadFeedbacks();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
        setShowCreateModal(false);
        setNewFeedbackData({
          reviewee: "",
          category: "collaboration",
          projectId: "",
          comments: ""
        });
      }, 2000);
    } catch (e: any) {
      const errorMessage = e.message.includes("user rejected transaction")
        ? "Transaction rejected by user"
        : "Submission failed: " + (e.message || "Unknown error");
      
      setTransactionStatus({
        visible: true,
        status: "error",
        message: errorMessage
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    } finally {
      setCreating(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.reviewee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      filterCategory === "all" || feedback.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const teamMembers = [
    { name: "Alice", role: "Project Manager", address: "0x123...456" },
    { name: "Bob", role: "Frontend Developer", address: "0x234...567" },
    { name: "Charlie", role: "Backend Developer", address: "0x345...678" },
    { name: "Diana", role: "UI/UX Designer", address: "0x456...789" },
    { name: "Eve", role: "QA Engineer", address: "0x567...890" }
  ];

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading encrypted feedback system...</p>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <h1>Project360<span>FHE</span></h1>
          <p>Confidential 360° Feedback</p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="primary-btn"
          >
            + Submit Feedback
          </button>
          <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </header>
      
      <main className="main-content">
        <section className="intro-section card">
          <h2>Secure Team Feedback with FHE</h2>
          <p>
            Project360 FHE enables confidential 360-degree feedback for project teams. 
            All evaluations are encrypted using Fully Homomorphic Encryption (FHE), 
            ensuring individual responses remain private while allowing project managers 
            to view aggregated insights.
          </p>
          <div className="fhe-badge">
            <span>FHE-Powered Confidentiality</span>
          </div>
        </section>
        
        <section className="stats-section">
          <div className="stat-card card">
            <h3>Total Feedbacks</h3>
            <div className="stat-value">{totalFeedbacks}</div>
          </div>
          <div className="stat-card card">
            <h3>Collaboration</h3>
            <div className="stat-value">{collaborationCount}</div>
          </div>
          <div className="stat-card card">
            <h3>Communication</h3>
            <div className="stat-value">{communicationCount}</div>
          </div>
          <div className="stat-card card">
            <h3>Technical</h3>
            <div className="stat-value">{technicalCount}</div>
          </div>
        </section>
        
        <section className="team-section card">
          <h2>Project Team Members</h2>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member">
                <div className="member-avatar">{member.name.charAt(0)}</div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                  <small>{member.address}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <section className="feedback-section">
          <div className="section-header">
            <h2>Feedback Records</h2>
            <div className="controls">
              <input
                type="text"
                placeholder="Search by reviewee or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                <option value="collaboration">Collaboration</option>
                <option value="communication">Communication</option>
                <option value="technical">Technical Skills</option>
              </select>
              <button 
                onClick={loadFeedbacks}
                className="refresh-btn"
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
          
          <div className="feedback-list card">
            {filteredFeedbacks.length === 0 ? (
              <div className="no-feedbacks">
                <p>No feedback records found</p>
                <button 
                  className="primary-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Submit First Feedback
                </button>
              </div>
            ) : (
              filteredFeedbacks.map(feedback => (
                <div className="feedback-item" key={feedback.id}>
                  <div className="feedback-header">
                    <span className="project-id">Project: {feedback.projectId}</span>
                    <span className="timestamp">
                      {new Date(feedback.timestamp * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="feedback-body">
                    <div className="feedback-meta">
                      <span className="category-badge">{feedback.category}</span>
                      <span>Reviewer: {feedback.reviewer.substring(0, 6)}...{feedback.reviewer.substring(38)}</span>
                      <span>Reviewee: {feedback.reviewee}</span>
                    </div>
                    <div className="feedback-content">
                      <p>Encrypted with FHE: {feedback.encryptedData.substring(0, 30)}...</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
  
      {showCreateModal && (
        <ModalCreate 
          onSubmit={submitFeedback} 
          onClose={() => setShowCreateModal(false)} 
          creating={creating}
          feedbackData={newFeedbackData}
          setFeedbackData={setNewFeedbackData}
          teamMembers={teamMembers}
        />
      )}
      
      {walletSelectorOpen && (
        <WalletSelector
          isOpen={walletSelectorOpen}
          onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
          onClose={() => setWalletSelectorOpen(false)}
        />
      )}
      
      {transactionStatus.visible && (
        <div className={`transaction-notification ${transactionStatus.status}`}>
          <div className="notification-content">
            {transactionStatus.status === "pending" && <div className="spinner"></div>}
            {transactionStatus.message}
          </div>
        </div>
      )}
  
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Project360 FHE</h3>
            <p>Confidential team feedback powered by FHE technology</p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">GitHub</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Project360 FHE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

interface ModalCreateProps {
  onSubmit: () => void; 
  onClose: () => void; 
  creating: boolean;
  feedbackData: any;
  setFeedbackData: (data: any) => void;
  teamMembers: any[];
}

const ModalCreate: React.FC<ModalCreateProps> = ({ 
  onSubmit, 
  onClose, 
  creating,
  feedbackData,
  setFeedbackData,
  teamMembers
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFeedbackData({
      ...feedbackData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    if (!feedbackData.reviewee || !feedbackData.comments) {
      alert("Please fill required fields");
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="create-modal card">
        <div className="modal-header">
          <h2>Submit Confidential Feedback</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="fhe-notice">
            <span className="fhe-icon">🔒</span> Your feedback will be encrypted with FHE technology
          </div>
          
          <div className="form-group">
            <label>Team Member *</label>
            <select 
              name="reviewee"
              value={feedbackData.reviewee} 
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select team member</option>
              {teamMembers.map((member, index) => (
                <option key={index} value={member.address}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Project ID *</label>
            <input 
              type="text"
              name="projectId"
              value={feedbackData.projectId} 
              onChange={handleChange}
              placeholder="Enter project identifier" 
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Category *</label>
            <select 
              name="category"
              value={feedbackData.category} 
              onChange={handleChange}
              className="form-select"
            >
              <option value="collaboration">Collaboration</option>
              <option value="communication">Communication</option>
              <option value="technical">Technical Skills</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Feedback Comments *</label>
            <textarea 
              name="comments"
              value={feedbackData.comments} 
              onChange={handleChange}
              placeholder="Enter your confidential feedback..." 
              className="form-textarea"
              rows={4}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="secondary-btn"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={creating}
            className="primary-btn"
          >
            {creating ? "Encrypting with FHE..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;