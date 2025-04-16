const UserSchema = require("../../models/UserSchema");

// GET /api/users?search=delhi&page=1&limit=10
exports.getAllUsers = async (req, res) => {
    try {
        console.log('req.query', req.query)
        const { search, isVerified, page = 1, limit = 20 } = req.query;
        const query = {};
   
        // Filter by verification status
        if (isVerified !== undefined) {
            query.isVerified = isVerified === "true";
        }

        // Case-insensitive partial text search across fields including address
        if (search) {
            const regex = new RegExp(search, "i");
            const queryOr = [
                { email: regex },
                { "fullName.firstName": regex },
                { "fullName.lastName": regex },
                { "address.city": regex },
                { "address.pincode": regex },
                { "address.state": regex },
            ];
        
            if (!isNaN(search)) {
                queryOr.push({ phoneNo: Number(search) });
            }
        
            query.$or = queryOr;
        }
        

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await UserSchema.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .select("-password -resetToken -resetTokenExpires -socialLogin")
            .lean();

        const totalUsers = await UserSchema.countDocuments(query);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total: totalUsers,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalUsers / limit),
            },
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await UserSchema.findById(req.params.id)
            .select("-password -resetToken -resetTokenExpires -socialLogin")
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error("Error fetching user by ID:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};