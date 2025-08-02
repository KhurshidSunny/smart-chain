import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getUsers, createUser, updateUser, deleteUser, getUserById } from '../../../services/userService';
import DataTable from '../../../components/common/DataDisplay/DataTable';
import ConfirmationModal from '../../../components/common/ConfirmationModal/ConfirmationModal';

function Users() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', roleName: ROLES.CUSTOMER });
  const allowedRoles = [ROLES.ADMIN];
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    searchQuery: '',
    sortBy: 'firstName',
    sortOrder: 'asc',
    createdDateFrom: '',
    createdDateTo: '',
    lastLoginFrom: '',
    lastLoginTo: ''
  });

  useEffect(() => {
    console.log(user);
  }, [user]);

  // Restrict access to admins
  if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
    navigate('/login');
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters whenever users or filters change
  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      const usersData = response.data.users || response.data || [];

      const transformedUsers = usersData.map(user => ({
        _id: user.id || user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.role || user.roleName,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user => 
        user.roleName?.toLowerCase() === filters.role.toLowerCase()
      );
    }

    // Active status filter
    if (filters.isActive !== '') {
      const isActiveBoolean = filters.isActive === 'true';
      filtered = filtered.filter(user => user.isActive === isActiveBoolean);
    }

    // Search query filter (searches in email, firstName, lastName)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query)
      );
    }

    // Date filters
    if (filters.createdDateFrom) {
      filtered = filtered.filter(user => 
        new Date(user.createdAt) >= new Date(filters.createdDateFrom)
      );
    }

    if (filters.createdDateTo) {
      filtered = filtered.filter(user => 
        new Date(user.createdAt) <= new Date(filters.createdDateTo)
      );
    }

    if (filters.lastLoginFrom) {
      filtered = filtered.filter(user => 
        user.lastLogin && new Date(user.lastLogin) >= new Date(filters.lastLoginFrom)
      );
    }

    if (filters.lastLoginTo) {
      filtered = filtered.filter(user => 
        user.lastLogin && new Date(user.lastLogin) <= new Date(filters.lastLoginTo)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy] || '';
      const bValue = b[filters.sortBy] || '';
      
      if (filters.sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      isActive: '',
      searchQuery: '',
      sortBy: 'firstName',
      sortOrder: 'asc',
      createdDateFrom: '',
      createdDateTo: '',
      lastLoginFrom: '',
      lastLoginTo: ''
    });
  };

  const handleCreateUser = async () => {
    try {
      const response = await createUser(formData);

      const newUser = {
        _id: response.data.id || response.data._id,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        roleName: response.data.role || response.data.roleName,
        isActive: response.data.isActive,
        lastLogin: response.data.lastLogin,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };

      setUsers([...users, newUser]);
      setFormData({ email: '', password: '', firstName: '', lastName: '', roleName: ROLES.CUSTOMER });
      setIsCreateModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    try {
      const response = await updateUser(selectedUser._id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleName: formData.roleName
      });

      setUsers(users.map((u) => (
        u._id === selectedUser._id
          ? { ...u, firstName: formData.firstName, lastName: formData.lastName, roleName: formData.roleName }
          : u
      )));

      setIsEditModalOpen(false);
      setSelectedUser(null);
      setFormData({ email: '', password: '', firstName: '', lastName: '', roleName: ROLES.CUSTOMER });
      setError(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = (userId) => {
    if (userId === user?._id) {
      setError('Cannot delete your own account');
      return;
    }
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete);
      setUsers(users.filter((u) => u._id !== userToDelete));
      setError(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await getUserById(userId);

      const userData = response.data;
      setSelectedUser({
        _id: userData.id || userData._id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleName: userData.role || userData.roleName
      });

      setFormData({
        email: userData.email,
        password: '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        roleName: userData.role || userData.roleName || ROLES.CUSTOMER
      });

      setIsEditModalOpen(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const columns = [
    { key: '_id', header: 'User ID' },
    { key: 'email', header: 'Email' },
    { key: 'firstName', header: 'First Name', render: (user) => user.firstName || 'N/A' },
    { key: 'lastName', header: 'Last Name', render: (user) => user.lastName || 'N/A' },
    { key: 'roleName', header: 'Role' },
    { 
      key: 'isActive', 
      header: 'Status', 
      render: (user) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      key: 'lastLogin', 
      header: 'Last Login', 
      render: (user) => formatDate(user.lastLogin)
    },
    { 
      key: 'createdAt', 
      header: 'Created', 
      render: (user) => formatDate(user.createdAt)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewUser(user._id)}
            className="text-primary hover:underline"
          >
            View/Edit
          </button>
          <button
            onClick={() => handleDeleteUser(user._id)}
            className="text-red-500 hover:underline"
            disabled={user.id === user?._id}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6">
      
      {error && (
        <div className="text-red-500 mb-4 p-3 bg-red-100 border border-red-300 rounded">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">User Management</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={() => {
                setFormData({ email: '', password: '', firstName: '', lastName: '', roleName: ROLES.CUSTOMER });
                setIsCreateModalOpen(true);
                setError(null);
              }}
              className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Create User
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search Query */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Search by email, name..."
                />
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">All Roles</option>
                  {Object.values(ROLES).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                  <option value="email">Email</option>
                  <option value="roleName">Role</option>
                  <option value="createdAt">Created Date</option>
                  <option value="lastLogin">Last Login</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              {/* Created Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created From</label>
                <input
                  type="date"
                  value={filters.createdDateFrom}
                  onChange={(e) => handleFilterChange('createdDateFrom', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Created Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created To</label>
                <input
                  type="date"
                  value={filters.createdDateTo}
                  onChange={(e) => handleFilterChange('createdDateTo', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Last Login From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Login From</label>
                <input
                  type="date"
                  value={filters.lastLoginFrom}
                  onChange={(e) => handleFilterChange('lastLoginFrom', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Last Login To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Login To</label>
                <input
                  type="date"
                  value={filters.lastLoginTo}
                  onChange={(e) => handleFilterChange('lastLoginTo', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {users.length === 0 
              ? "No users found. Create your first user to get started."
              : "No users match the current filters."
            }
          </div>
        ) : (
          <DataTable data={filteredUsers} columns={columns} />
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Create User</h2>
            {error && (
              <div className="text-red-500 mb-4 p-2 bg-red-100 border border-red-300 rounded text-sm">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  {Object.values(ROLES).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleCreateUser}
                  className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={!formData.email || !formData.password || !formData.firstName || !formData.lastName}
                >
                  Create User
                </button>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setError(null);
                  }}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Edit User</h2>
            {error && (
              <div className="text-red-500 mb-4 p-2 bg-red-100 border border-red-300 rounded text-sm">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full p-2 border rounded bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {Object.values(ROLES).map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleEditUser}
                  className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                    setError(null);
                  }}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete User */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        cancelButtonClass="bg-gray-500 hover:bg-gray-600"
      />
    </div>
  );
}

export default Users;