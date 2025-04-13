const Order = require("../../models/OrderModel");

exports.adminUpdateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { shippingMethod, trackingNumber, estimatedDeliveryDate, status, orderTracking, adminNote, refund } = req.body;

        // Validate order existence
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Validate orderTracking
        if (orderTracking) {
            if (!Array.isArray(orderTracking)) {
                return res.status(400).json({ message: "Order tracking must be an array" });
            }
            for (const track of orderTracking) {
                if (!track.dateAndTime || !track.location) {
                    return res.status(400).json({ message: "Each tracking entry must have dateAndTime and location" });
                }
            }
            order.orderTracking = orderTracking;
        }

        // Validate status
        const validStatuses = ["pending", "processing", "shipped", "cancelled", "completed"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status" });
        }
        if (status) order.status = status;

        // Update allowed fields
        if (shippingMethod) order.shipping.method = shippingMethod;
        if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
        if (estimatedDeliveryDate) order.estimatedDeliveryDate = estimatedDeliveryDate;
        if (adminNote) order.adminNote = adminNote;

        // Update refund details
        if (refund) {
            if (refund.isRefunded) order.refund.isRefunded = true;
            if (refund.amount) order.refund.amount = refund.amount;
            if (refund.reason) order.refund.reason = refund.reason;
            if (refund.isRefunded) order.refund.refundedAt = refund.refundedAt || new Date();
        }

        // Save the updated order
        await order.save();

        return res.status(200).json({ message: "Order updated successfully by admin", order });
    } catch (error) {
        console.error("Error updating order by admin:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const query = {};

        // Filter by order status
        if (status) {
            const validStatuses = ["pending", "processing", "shipped", "cancelled", "completed"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid order status" });
            }
            query.status = status;
        }

        // Apply date range filter if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query).sort({ createdAt: -1 }).populate("userId", "fullName email phoneNo") // Populate user details (fetch name & email only)
        .populate({
            path: "products.product",
            model: "Product",
            select: "title description images category",
        });

        return res.status(200).json({ message: "All orders retrieved successfully", orders });
    } catch (error) {
        console.error("Error retrieving all orders:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        const order = await Order.findById(orderId)
            .populate("userId", "fullName email phoneNo")
            .populate({
                path: "products.product",
                model: "Product",
                select: "title description images category",
            });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({ message: "Order fetched successfully", order });
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
