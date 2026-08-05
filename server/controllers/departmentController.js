const Department = require('../models/Department');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .select('departmentName description')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Departments fetched successfully',
      data: { departments },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching departments',
      data: null,
    });
  }
};
