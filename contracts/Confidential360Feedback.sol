// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract Confidential360Feedback is SepoliaConfig {
    // Encrypted evaluation data structure
    struct EncryptedEvaluation {
        euint32 raterId;          // Encrypted rater identifier
        euint32 ratedMemberId;    // Encrypted team member being evaluated
        euint32 collaboration;    // Encrypted collaboration score
        euint32 communication;    // Encrypted communication score
        euint32 technicalSkill;   // Encrypted technical skill score
        uint256 timestamp;
    }
    
    // Aggregated team statistics
    struct TeamStats {
        euint32 totalEvaluations; // Encrypted evaluation count
        euint32 collaborationSum; // Encrypted collaboration sum
        euint32 communicationSum; // Encrypted communication sum
        euint32 technicalSum;     // Encrypted technical skill sum
    }
    
    // Project state variables
    mapping(uint256 => EncryptedEvaluation) private evaluations;
    mapping(uint256 => TeamStats) private teamStats;
    uint256[] private activeTeams;
    uint256 private evaluationCounter;
    
    // Decryption tracking
    mapping(uint256 => uint256) private requestToTeamId;
    
    // Events
    event EvaluationSubmitted(uint256 indexed evaluationId);
    event AggregationComplete(uint256 indexed teamId);
    event StatsRequested(uint256 indexed teamId);
    event StatsDecrypted(uint256 indexed teamId);

    /// @notice Submit encrypted team evaluation
    function submitEvaluation(
        euint32 raterId,
        euint32 ratedMemberId,
        euint32 collaborationScore,
        euint32 communicationScore,
        euint32 technicalScore
    ) external {
        uint256 newId = ++evaluationCounter;
        
        evaluations[newId] = EncryptedEvaluation({
            raterId: raterId,
            ratedMemberId: ratedMemberId,
            collaboration: collaborationScore,
            communication: communicationScore,
            technicalSkill: technicalScore,
            timestamp: block.timestamp
        });
        
        emit EvaluationSubmitted(newId);
    }

    /// @notice Process evaluations for a team
    function processTeamEvaluations(uint256 teamId) external {
        require(!FHE.isInitialized(teamStats[teamId].totalEvaluations), "Already processed");
        
        // Initialize team stats
        teamStats[teamId] = TeamStats({
            totalEvaluations: FHE.asEuint32(0),
            collaborationSum: FHE.asEuint32(0),
            communicationSum: FHE.asEuint32(0),
            technicalSum: FHE.asEuint32(0)
        });
        
        activeTeams.push(teamId);
        emit AggregationComplete(teamId);
    }

    /// @notice Add evaluation to team statistics
    function addEvaluationToStats(uint256 evaluationId, uint256 teamId) external {
        EncryptedEvaluation memory eval = evaluations[evaluationId];
        TeamStats storage stats = teamStats[teamId];
        
        // Update encrypted aggregates
        stats.totalEvaluations = FHE.add(stats.totalEvaluations, FHE.asEuint32(1));
        stats.collaborationSum = FHE.add(stats.collaborationSum, eval.collaboration);
        stats.communicationSum = FHE.add(stats.communicationSum, eval.communication);
        stats.technicalSum = FHE.add(stats.technicalSum, eval.technicalSkill);
    }

    /// @notice Request team statistics decryption
    function requestTeamStatsDecryption(uint256 teamId) external {
        TeamStats storage stats = teamStats[teamId];
        require(FHE.isInitialized(stats.totalEvaluations), "No data");
        
        // Prepare encrypted data for decryption
        bytes32[] memory ciphertexts = new bytes32[](4);
        ciphertexts[0] = FHE.toBytes32(stats.totalEvaluations);
        ciphertexts[1] = FHE.toBytes32(stats.collaborationSum);
        ciphertexts[2] = FHE.toBytes32(stats.communicationSum);
        ciphertexts[3] = FHE.toBytes32(stats.technicalSum);
        
        // Request decryption
        uint256 reqId = FHE.requestDecryption(ciphertexts, this.handleStatsDecryption.selector);
        requestToTeamId[reqId] = teamId;
        
        emit StatsRequested(teamId);
    }

    /// @notice Handle decrypted statistics
    function handleStatsDecryption(
        uint256 requestId,
        bytes memory cleartext,
        bytes memory proof
    ) external {
        uint256 teamId = requestToTeamId[requestId];
        require(teamId != 0, "Invalid request");
        
        // Verify decryption proof
        FHE.checkSignatures(requestId, cleartext, proof);
        
        // Process decrypted values
        uint256[] memory results = abi.decode(cleartext, (uint256[]));
        // Results structure: [totalEvals, collabSum, commSum, techSum]
        emit StatsDecrypted(teamId);
    }

    /// @notice Get list of active teams
    function getActiveTeams() external view returns (uint256[] memory) {
        return activeTeams;
    }
}