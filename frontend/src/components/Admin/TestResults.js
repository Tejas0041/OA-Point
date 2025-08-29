import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../../config/api';
import { 
  ArrowLeft, 
  Download, 
  Send, 
  BarChart3, 
  Users,
  Clock,
  Trophy,
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const TestResults = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]); // Store all results for filtering
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingResults, setSendingResults] = useState(false);
  const [scoreFilter, setScoreFilter] = useState(null); // Current score filter
  const [selectedViolations, setSelectedViolations] = useState(null);
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchTestResults();
    fetchTestStatistics();
  }, [testId]);

  const fetchTestResults = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_TEST_RESULTS(testId));
      setAllResults(response.data.results);
      setResults(response.data.results);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load test results');
    }
  };

  const fetchTestStatistics = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.TEST_STATISTICS(testId));
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByScoreRange = (range) => {
    if (scoreFilter === range) {
      // Clear filter if clicking the same range
      setScoreFilter(null);
      setResults(allResults);
      // Reapply current sort if any
      if (sortConfig.key) {
        setTimeout(() => handleSort(sortConfig.key), 0);
      }
      return;
    }

    setScoreFilter(range);
    
    const filtered = allResults.filter(result => {
      const percentage = result.percentage || 0;
      switch (range) {
        case '90-100':
          return percentage >= 90;
        case '80-89':
          return percentage >= 80 && percentage < 90;
        case '70-79':
          return percentage >= 70 && percentage < 80;
        case '60-69':
          return percentage >= 60 && percentage < 70;
        case '50-59':
          return percentage >= 50 && percentage < 60;
        case 'Below 50':
          return percentage < 50;
        default:
          return true;
      }
    });
    
    setResults(filtered);
    // Reapply current sort if any
    if (sortConfig.key) {
      setTimeout(() => handleSort(sortConfig.key), 0);
    }
  };

  const clearFilter = () => {
    setScoreFilter(null);
    setResults(allResults);
    // Reapply current sort if any
    if (sortConfig.key) {
      setTimeout(() => handleSort(sortConfig.key), 0);
    }
  };

  const sendResultsToStudents = async () => {
    setSendingResults(true);
    try {
      await axios.post(API_ENDPOINTS.ADMIN_TEST_SEND_RESULTS(testId));
      toast.success('Results sent to all students successfully');
    } catch (error) {
      console.error('Error sending results:', error);
      toast.error('Failed to send results');
    } finally {
      setSendingResults(false);
    }
  };

  const exportResults = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Registration Number', 'Score', 'Max Score', 'Percentage', 'Time Taken', 'Submission Time'];
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.studentId.name,
        result.studentId.email,
        result.studentId.registrationNumber || 'N/A',
        result.totalScore,
        result.maxScore,
        result.percentage.toFixed(2) + '%',
        calculateTimeTaken(result.startTime, result.endTime),
        result.endTime ? new Date(result.endTime).toLocaleString() : 'N/A'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${testId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const calculateTimeTaken = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeSpentMs = end - start;
    const timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60));
    const timeSpentSeconds = Math.floor((timeSpentMs % (1000 * 60)) / 1000);
    
    if (timeSpentMinutes >= 60) {
      const hours = Math.floor(timeSpentMinutes / 60);
      const minutes = timeSpentMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
    
    return timeSpentSeconds > 0 ? `${timeSpentMinutes}m ${timeSpentSeconds}s` : `${timeSpentMinutes}m`;
  };

  const showViolations = (violations, studentName) => {
    setSelectedViolations({ violations, studentName });
    setShowViolationsModal(true);
  };

  const closeViolationsModal = () => {
    setShowViolationsModal(false);
    setSelectedViolations(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedResults = [...results].sort((a, b) => {
      let aValue, bValue;

      switch (key) {
        case 'name':
          aValue = a.studentId.name.toLowerCase();
          bValue = b.studentId.name.toLowerCase();
          break;
        case 'score':
          aValue = a.totalScore;
          bValue = b.totalScore;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case 'timeTaken':
          // Calculate time in minutes for sorting
          const getTimeInMinutes = (startTime, endTime) => {
            if (!startTime || !endTime) return 0;
            return (new Date(endTime) - new Date(startTime)) / (1000 * 60);
          };
          aValue = getTimeInMinutes(a.startTime, a.endTime);
          bValue = getTimeInMinutes(b.startTime, b.endTime);
          break;
        case 'submissionTime':
          aValue = a.endTime ? new Date(a.endTime) : new Date(0);
          bValue = b.endTime ? new Date(b.endTime) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setResults(sortedResults);
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <img 
                  src="/images/logo_oa_point.webp" 
                  alt="OA Point Logo" 
                  className="h-10 w-10 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    <span className="text-primary-600">OA Point</span> Results
                  </h1>
                  <p className="text-gray-600">View and manage test results</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-500">Assessment Platform</div>
                <div className="text-xs text-gray-400">
                  Need help? <a href="mailto:onlineassessment.point@gmail.com" className="text-primary-600 hover:text-primary-800">Contact Support</a>
                </div>
              </div>
              <button
                onClick={exportResults}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={sendResultsToStudents}
                disabled={sendingResults}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{sendingResults ? 'Sending...' : 'Send Results'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Invited</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalInvited}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalCompleted}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalInProgress}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.averageScore}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Distribution */}
        {statistics && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(statistics.scoreDistribution).map(([range, count]) => (
                <button
                  key={range}
                  onClick={() => filterByScoreRange(range)}
                  className={`text-center p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    scoreFilter === range
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-900'
                  }`}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm">{range}%</div>
                </button>
              ))}
            </div>
            {scoreFilter && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600 mr-2">
                  Showing students with {scoreFilter}% scores
                </span>
                <button
                  onClick={clearFilter}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Student Results</h2>
            <div className="text-sm text-gray-600">
              {scoreFilter ? (
                <span>
                  {results.length} of {allResults.length} students 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {scoreFilter}% filter active
                  </span>
                </span>
              ) : (
                `${results.length} students`
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Results will appear here once students complete the test.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Student</span>
                        {getSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('score')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Score</span>
                        {getSortIcon('score')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('percentage')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Percentage</span>
                        {getSortIcon('percentage')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('timeTaken')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Time Taken</span>
                        {getSortIcon('timeTaken')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('submissionTime')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Submission Time</span>
                        {getSortIcon('submissionTime')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violations
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.studentId.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.studentId.email}
                          </div>
                          {result.studentId.registrationNumber && (
                            <div className="text-xs text-gray-400">
                              {result.studentId.registrationNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {result.totalScore} / {result.maxScore}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.percentage)}`}>
                          {result.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calculateTimeTaken(result.startTime, result.endTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.endTime 
                          ? new Date(result.endTime).toLocaleString()
                          : 'Not submitted'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.violations && result.violations.length > 0 ? (
                          <button
                            onClick={() => showViolations(result.violations, result.studentId.name)}
                            className="flex items-center text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span className="text-sm">{result.violations.length}</span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Violations Modal */}
      {showViolationsModal && selectedViolations && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Violations - {selectedViolations.studentName}
                </h3>
                <button
                  onClick={closeViolationsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {selectedViolations.violations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No violations recorded</p>
                ) : (
                  <div className="space-y-4">
                    {selectedViolations.violations.map((violation, index) => (
                      <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-red-800 capitalize">
                                {violation.type.replace('-', ' ')}
                              </h4>
                              <span className="text-xs text-red-600">
                                {new Date(violation.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-red-700">
                              {violation.description}
                            </p>
                            {violation.details && (
                              <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                                <strong>Details:</strong> {violation.details}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeViolationsModal}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;