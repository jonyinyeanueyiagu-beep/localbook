import { useState, useEffect } from "react";
import api from "../../services/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    description: "",
    color: "#7c3aed",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log("Fetching categories...");
      
      const response = await api.get("/categories");
      console.log("Categories response:", response.data);
      
      if (response.data) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setMessage("❌ Failed to load categories");
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      setMessage("❌ Category name is required");
      return;
    }

    if (!newCategory.icon.trim()) {
      setMessage("❌ Category icon is required");
      return;
    }

    try {
      console.log("Adding category:", newCategory);
      
      const response = await api.post("/categories", {
        name: newCategory.name.trim(),
        icon: newCategory.icon.trim(),
        description: newCategory.description.trim(),
        color: newCategory.color,
      });

      console.log("Add category response:", response.data);
      
      setMessage("✅ Category added successfully");
      fetchCategories();
      setShowAddModal(false);
      setNewCategory({ name: "", icon: "", description: "", color: "#7c3aed" });
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error adding category:", error);
      console.error("Error response:", error.response);
      
      if (error.response && error.response.data && error.response.data.message) {
        setMessage("❌ " + error.response.data.message);
      } else {
        setMessage("❌ Failed to add category");
      }
      
      setTimeout(() => {
        setMessage("");
      }, 5000);
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editingCategory.name.trim()) {
      setMessage("❌ Category name is required");
      return;
    }

    try {
      console.log("Updating category:", id, editingCategory);
      
      const response = await api.put(`/categories/${id}`, {
        name: editingCategory.name.trim(),
        icon: editingCategory.icon.trim(),
        description: editingCategory.description.trim(),
        color: editingCategory.color,
      });

      console.log("Update category response:", response.data);
      
      setMessage("✅ Category updated successfully");
      fetchCategories();
      setEditingCategory(null);
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating category:", error);
      console.error("Error response:", error.response);
      
      if (error.response && error.response.data && error.response.data.message) {
        setMessage("❌ " + error.response.data.message);
      } else {
        setMessage("❌ Failed to update category");
      }
      
      setTimeout(() => {
        setMessage("");
      }, 5000);
    }
  };

  const handleDeleteCategory = async (id, categoryName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${categoryName}"?\n\nAll businesses in this category will need to be reassigned.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      console.log("Deleting category:", id);
      
      await api.delete(`/categories/${id}`);
      
      console.log("Category deleted successfully");
      
      setMessage("✅ Category deleted successfully");
      fetchCategories();
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting category:", error);
      console.error("Error response:", error.response);
      
      if (error.response && error.response.status === 409) {
        setMessage("❌ Cannot delete category with existing businesses");
      } else if (error.response && error.response.data && error.response.data.message) {
        setMessage("❌ " + error.response.data.message);
      } else {
        setMessage("❌ Failed to delete category");
      }
      
      setTimeout(() => {
        setMessage("");
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 min-h-screen p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">📂 Categories Management</h1>
          <p className="text-gray-600 mt-2">
            Manage business categories on the platform
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold flex items-center gap-2 shadow-lg"
        >
          ➕ Add Category
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg font-semibold ${
            message.includes("✅")
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1 font-semibold">Total Categories</p>
          <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1 font-semibold">Total Businesses</p>
          <p className="text-3xl font-bold text-blue-600">
            {categories.reduce((sum, cat) => sum + (cat.businessCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Categories Yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first business category</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold"
          >
            ➕ Add First Category
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              style={{ borderLeft: `4px solid ${category.color || '#7c3aed'}` }}
            >
              {editingCategory && editingCategory.id === category.id ? (
                /* Edit Mode */
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <input
                      type="text"
                      value={editingCategory.icon}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, icon: e.target.value })
                      }
                      placeholder="Icon emoji"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editingCategory.description}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="2"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={editingCategory.color}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, color: e.target.value })
                      }
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCategory(category.id)}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {category.businessCount || 0} businesses
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 text-sm">
                    {category.description || 'No description'}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-semibold"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-semibold"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">➕ Add New Category</h2>
              <p className="text-purple-100 text-sm mt-1">Create a new business category</p>
            </div>

            <form onSubmit={handleAddCategory} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    placeholder="e.g., Hair Salons"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon (Emoji) *
                  </label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, icon: e.target.value })
                    }
                    placeholder="💇"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-2xl"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Use an emoji to represent this category</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, description: e.target.value })
                    }
                    placeholder="Brief description of this category"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, color: e.target.value })
                    }
                    className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">Choose a color to identify this category</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold shadow-lg"
                >
                  ✓ Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategory({ name: "", icon: "", description: "", color: "#7c3aed" });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                >
                  ✕ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;