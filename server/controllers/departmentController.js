const Department = require('../models/Department');
const { HttpError, success } = require('../utils/http');

exports.getDepartments = async (req, res) => {
  const departments = await Department.find()
    .select('departmentName description')
    .sort({ departmentName: 1 })
    .lean();
  return success(res, { departments });
};

exports.createDepartment = async (req, res) => {
  const { departmentName, description = '' } = req.body;
  const normalizedName = departmentName.toLowerCase();
  // Include departments created before normalized names were introduced.
  const existing = await Department.findOne({ departmentName })
    .collation({ locale: 'en', strength: 2 }).select('_id').lean();
  if (existing) throw new HttpError(409, 'A department with this name already exists');
  try {
    const department = await Department.create({ departmentName, normalizedName, description });
    return success(res, { department: {
      _id: department._id, departmentName: department.departmentName, description: department.description,
    } }, 'Department created successfully', 201);
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, 'A department with this name already exists');
    throw error;
  }
};
