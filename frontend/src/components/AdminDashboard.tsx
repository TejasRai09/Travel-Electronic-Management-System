import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  Download, 
  Settings, 
  BarChart3, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  FileSpreadsheet,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '../utils/toast';
import * as XLSX from 'xlsx';

interface Employee {
  _id: string;
  employeeNumber: string;
  employeeName: string;
  designation: string;
  email: string;
  phone: string;
  managerEmail: string;
  managerEmployeeNo: string;
  managerEmployeeName: string;
  impactLevel: string;
}

interface User {
  _id: string;
  email: string;
  isPOC: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  verified: boolean;
}

interface SystemConfig {
  _id: string;
  configKey: string;
  configValue: any;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

interface Stats {
  employees: number;
  users: number;
  pocs: number;
  vendors: number;
  admins: number;
}

type TabType = 'employees' | 'users' | 'config' | 'stats';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Employee form state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    employeeNumber: '',
    employeeName: '',
    designation: '',
    email: '',
    phone: '',
    managerEmail: '',
    managerEmployeeNo: '',
    managerEmployeeName: '',
    impactLevel: ''
  });

  // Config form state
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configForm, setConfigForm] = useState({
    configKey: 'approval_logic',
    configValue: { requiredLevels: ['3A', '3B', '3C'] },
    description: 'Final manager approval logic - impact levels required'
  });

  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'config') fetchConfigs();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  const getToken = () => localStorage.getItem('travelDeskToken');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/employees', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.ok) setEmployees(data.employees || []);
    } catch (error) {
      showErrorToast('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.ok) setUsers(data.users || []);
    } catch (error) {
      showErrorToast('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/config', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.ok) setConfigs(data.configs || []);
    } catch (error) {
      showErrorToast('Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.ok) setStats(data.stats);
    } catch (error) {
      showErrorToast('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/admin/employees/template/download', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_template.xlsx';
      a.click();
      showSuccessToast('Template downloaded successfully');
    } catch (error) {
      showErrorToast('Failed to download template');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = showLoadingToast('Processing Excel file...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform Excel data to employee format
      const employees = jsonData.map((row: any) => ({
        employeeNumber: row['Employee Number'] || '',
        employeeName: row['Employee Name'] || '',
        designation: row['Designation'] || '',
        email: row['Email'] || '',
        phone: row['Phone'] || '',
        managerEmail: row['Manager Email'] || '',
        managerEmployeeNo: row['Manager Employee No'] || '',
        managerEmployeeName: row['Manager Name'] || '',
        impactLevel: row['Impact Level'] || ''
      }));

      dismissToast(toastId);

      const confirmed = window.confirm(
        `Upload ${employees.length} employees?\n\nThis will OVERWRITE all existing employee data. This action cannot be undone.`
      );

      if (!confirmed) return;

      const uploadToast = showLoadingToast('Uploading employees...');

      const res = await fetch('/api/admin/employees/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ employees, overwrite: true })
      });

      const result = await res.json();
      dismissToast(uploadToast);

      if (result.ok) {
        showSuccessToast(
          `Upload completed! Added: ${result.stats.added}, Updated: ${result.stats.updated}, Skipped: ${result.stats.skipped}`
        );
        fetchEmployees();
      } else {
        showErrorToast(result.error || 'Upload failed');
      }
    } catch (error) {
      dismissToast(toastId);
      showErrorToast('Failed to process Excel file');
      console.error(error);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleSaveEmployee = async () => {
    const toastId = showLoadingToast('Saving employee...');
    try {
      const url = editingEmployee 
        ? `/api/admin/employees/${editingEmployee._id}`
        : '/api/admin/employees';
      
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(employeeForm)
      });

      const data = await res.json();
      dismissToast(toastId);

      if (data.ok) {
        showSuccessToast(editingEmployee ? 'Employee updated!' : 'Employee added!');
        setShowEmployeeForm(false);
        setEditingEmployee(null);
        setEmployeeForm({
          employeeNumber: '',
          employeeName: '',
          designation: '',
          email: '',
          phone: '',
          managerEmail: '',
          managerEmployeeNo: '',
          managerEmployeeName: '',
          impactLevel: ''
        });
        fetchEmployees();
      } else {
        showErrorToast(data.error || 'Failed to save employee');
      }
    } catch (error) {
      dismissToast(toastId);
      showErrorToast('Failed to save employee');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    const toastId = showLoadingToast('Deleting employee...');
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      const data = await res.json();
      dismissToast(toastId);

      if (data.ok) {
        showSuccessToast('Employee deleted successfully');
        fetchEmployees();
      } else {
        showErrorToast(data.error || 'Failed to delete employee');
      }
    } catch (error) {
      dismissToast(toastId);
      showErrorToast('Failed to delete employee');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      employeeNumber: employee.employeeNumber,
      employeeName: employee.employeeName,
      designation: employee.designation,
      email: employee.email,
      phone: employee.phone,
      managerEmail: employee.managerEmail,
      managerEmployeeNo: employee.managerEmployeeNo,
      managerEmployeeName: employee.managerEmployeeName,
      impactLevel: employee.impactLevel
    });
    setShowEmployeeForm(true);
  };

  const handleUpdateUserRoles = async (userId: string, isPOC: boolean, isVendor: boolean, isAdmin: boolean) => {
    const toastId = showLoadingToast('Updating user roles...');
    try {
      const res = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ isPOC, isVendor, isAdmin })
      });

      const data = await res.json();
      dismissToast(toastId);

      if (data.ok) {
        showSuccessToast('User roles updated successfully');
        fetchUsers();
      } else {
        showErrorToast(data.error || 'Failed to update user roles');
      }
    } catch (error) {
      dismissToast(toastId);
      showErrorToast('Failed to update user roles');
    }
  };

  const handleSaveConfig = async () => {
    const toastId = showLoadingToast('Saving configuration...');
    try {
      const res = await fetch(`/api/admin/config/${configForm.configKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          configValue: configForm.configValue,
          description: configForm.description
        })
      });

      const data = await res.json();
      dismissToast(toastId);

      if (data.ok) {
        showSuccessToast('Configuration saved successfully');
        setShowConfigForm(false);
        fetchConfigs();
      } else {
        showErrorToast(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      dismissToast(toastId);
      showErrorToast('Failed to save configuration');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-red-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Manage system settings, employees, and users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'employees'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Employees
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Users & Roles
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'config'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'stats'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Statistics
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setShowEmployeeForm(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
              <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Bulk Upload (Excel)
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Warning:</strong> Bulk upload will completely overwrite all existing employee data. Make sure to download the current data as backup before uploading.
              </div>
            </div>
          </div>

          {showEmployeeForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button
                  onClick={() => {
                    setShowEmployeeForm(false);
                    setEditingEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Number *
                  </label>
                  <input
                    type="text"
                    value={employeeForm.employeeNumber}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    value={employeeForm.employeeName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={employeeForm.designation}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Impact Level
                  </label>
                  <input
                    type="text"
                    value={employeeForm.impactLevel}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, impactLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 3A, 3B, 3C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    value={employeeForm.managerEmail}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, managerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager Employee No
                  </label>
                  <input
                    type="text"
                    value={employeeForm.managerEmployeeNo}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, managerEmployeeNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    value={employeeForm.managerEmployeeName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, managerEmployeeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEmployee}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
                <button
                  onClick={() => {
                    setShowEmployeeForm(false);
                    setEditingEmployee(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impact Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No employees found. Add employees or upload bulk data.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {emp.employeeNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {emp.employeeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {emp.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {emp.designation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {emp.impactLevel || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEmployee(emp)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    POC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="checkbox"
                          checked={user.isPOC}
                          onChange={(e) => handleUpdateUserRoles(user._id, e.target.checked, user.isVendor, user.isAdmin)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="checkbox"
                          checked={user.isVendor}
                          onChange={(e) => handleUpdateUserRoles(user._id, user.isPOC, e.target.checked, user.isAdmin)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="checkbox"
                          checked={user.isAdmin}
                          onChange={(e) => handleUpdateUserRoles(user._id, user.isPOC, user.isVendor, e.target.checked)}
                          className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.verified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <button
              onClick={() => setShowConfigForm(!showConfigForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {showConfigForm ? 'Hide Form' : 'Add/Update Configuration'}
            </button>
          </div>

          {showConfigForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Approval Logic Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Key
                  </label>
                  <input
                    type="text"
                    value={configForm.configKey}
                    onChange={(e) => setConfigForm({ ...configForm, configKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={configForm.description}
                    onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Impact Levels (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={configForm.configValue.requiredLevels?.join(', ') || ''}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      configValue: {
                        requiredLevels: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    placeholder="e.g., 3A, 3B, 3C"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Final manager must have one of these impact levels to approve
                  </p>
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Config Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : configs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No configurations found. Add a new configuration to get started.
                      </td>
                    </tr>
                  ) : (
                    configs.map((config) => (
                      <tr key={config._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {config.configKey}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {config.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <pre className="text-xs bg-gray-50 p-2 rounded">
                            {JSON.stringify(config.configValue, null, 2)}
                          </pre>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {config.updatedBy || 'System'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats?.employees || 0}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats?.users || 0}
                </p>
              </div>
              <Shield className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">POCs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats?.pocs || 0}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats?.vendors || 0}
                </p>
              </div>
              <FileSpreadsheet className="w-12 h-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats?.admins || 0}
                </p>
              </div>
              <Shield className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
