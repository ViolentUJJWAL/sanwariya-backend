import ContactUs from "../models/ContactUsModel.js";
import User from "../models/UserSchema.js";

// Get all Contact Us queries
const getAllContactUs = async (req, res) => {
  try {
    const queries = await ContactUs.find()
      .populate("user", "name email") // customize fields as needed
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({ success: true, data: queries });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// Respond to a Contact Us query
const responseContactUs = async (req, res) => {
  const { id } = req.params;
  const { response, status } = req.body;

  try {
    const updated = await ContactUs.findByIdAndUpdate(
      id,
      {
        response,
        status: status || "resolved",
        respondedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};
export default { getAllContactUs, responseContactUs };
