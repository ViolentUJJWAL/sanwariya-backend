const Coupon = require("../../models/CouponModel");
const Order = require("../../models/OrderModel");
const Payment = require("../../models/PaymentModel");
const Product = require("../../models/ProductModel");

exports.placeOrder = async (req, res) => {
    try {
        // Extract data from request body
        const {
            products,
            address,
            discountCode,
            paymentId,
            customerNote,
            giftOptions,
        } = req.body;

        let totalAmount = 0;

        // **Validation Products**
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Products are required" });
        }
        for (const item of products) {
            if (!item.product || !item.quantity || !item.totalPrice || !item.productVariety) {
                return res.status(400).json({ message: "Each product must have product ID, quantity, and totalPrice" });
            }
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ message: `Product with ID ${item.product} not found` });
            }
            if (item.quantity < 1 || item.totalPrice < 0) {
                return res.status(400).json({ message: "Invalid quantity or totalPrice in products" });
            }

            totalAmount = + item.totalPrice;

        }

        for (const orderedProduct of products) {
            const productId = orderedProduct.product;
            const varietyId = orderedProduct.productVariety.id;
            const quantityOrdered = orderedProduct.quantity;

            // Fetch the product
            const product = await Product.findById(productId);
            if (!product) {
                console.log(`Product ${product.title} not found`);
                return res.status(404).json({ message: `Product ${product.title} not found` });
            }

            // Find the correct variety
            const variety = product.variety.find(v => v.id === varietyId);
            if (!variety) {
                console.log(`Variety ${varietyId} not found in product ${productId}`);
                return res.status(404).json({ message: `Variety not found in product` });
            }

            // Check stock availability
            if (variety.stock < quantityOrdered) {
                return res.status(400).json({ message: `Insufficient stock for ${product.title}` });
            }

            // Decrease stock
            variety.stock -= quantityOrdered;

            // Save updated product
            await product.save();
            console.log(`Stock updated for variety ${varietyId}, new stock: ${variety.stock}`);
        }

        // **Validation Address**
        if (!address || !address.flatNo || !address.street || !address.city ||
            !address.state || !address.pincode || !address.country) {
            return res.status(400).json({ message: "Complete address is required" });
        }

        // **Validation Total Amount**
        if (totalAmount <= 0) {
            return res.status(400).json({ message: "Total amount must be a positive number" });
        }

        let discountAmount = 0;
        let discount = undefined;
        if (discountCode) {

            const coupon = await Coupon.findOne({ code: discountCode, active: true });
            if (!coupon) return res.status(404).json({ message: 'Coupon not found or inactive' });

            if (coupon.expirationDate && coupon.expirationDate < new Date()) {
                return res.status(400).json({ message: 'Coupon has expired' });
            }

            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({ message: 'Coupon usage limit reached' });
            }

            if (totalAmount < coupon.minimumPurchase) {
                return res.status(201).json({ message: `Minimum purchase amount is ${coupon.minimumPurchase}` });
            }

            if (coupon.discountType === 'fixed') {
                discountAmount = coupon.discountValue;
            } else if (coupon.discountType === 'percentage') {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscountAmount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                }
            }

            coupon.usedCount += 1;
            await coupon.save();
            discount = {
                code: discountCode,
                amount: discountAmount
            }
        }

        let shippingCost = 50;

        let payableAmount = (totalAmount - discountAmount) + shippingCost

        if (payableAmount <= 0) {
            return res.status(400).json({ message: "Payable amount must be a positive number" });
        }

        // **Validation Payment**
        // const payment = await Payment.findById(paymentId);
        // if (!payment) {
        //     return res.status(400).json({ message: "Invalid payment ID" });
        // }

        // Create new order object
        const order = new Order({
            userId: req.user._id,
            products,
            address,
            totalAmount,
            payableAmount,
            shipping: { cost: shippingCost },
            paymentId,
            discount: discount,
            customerNote: customerNote || undefined,
            giftOptions: giftOptions || undefined,
        });

        // Save the order (Mongoose will handle orderNumber and estimatedDeliveryDate via pre-save hook)
        await order.save();

        // Success response
        return res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updatePlaceOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { customerNote, giftOptions, paymentId, address } = req.body;

        // Validate order existence
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if the user owns the order
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to update this order" });
        }

        // Update customerNote and giftOptions
        if (customerNote) order.customerNote = customerNote;
        if (giftOptions) order.giftOptions = giftOptions;

        // Update paymentId
        if (paymentId) {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                return res.status(400).json({ message: "Invalid payment ID" });
            }
            order.paymentId = paymentId;
        }

        // Update address only if status is pending
        if (address && order.status === 'pending') {
            const requiredFields = ['flatNo', 'street', 'city', 'state', 'pincode', 'country'];
            const isAddressValid = requiredFields.every(field => address[field]);

            if (!isAddressValid) {
                return res.status(400).json({ message: "Complete address is required" });
            }

            order.address = address;
        } else if (address) {
            return res.status(400).json({ message: "Address can only be updated for pending orders" });
        }

        // Save the updated order
        await order.save();

        return res.status(200).json({ message: "Order updated successfully", order });
    } catch (error) {
        console.error("Error updating order:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(req.user)
        const query = { userId: req.user._id };

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
        });;

        return res.status(200).json({ message: "Orders retrieved successfully", orders });
    } catch (error) {
        console.error("Error retrieving user orders:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getOrdersById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const query = { userId: req.user._id, _id: orderId };

        const orders = await Order.findOne(query).sort({ createdAt: -1 }).populate("userId", "fullName email phoneNo") // Populate user details (fetch name & email only)
        .populate({
            path: "products.product",
            model: "Product",
            select: "title description images category",
        });;

        return res.status(200).json({ message: "Orders retrieved successfully", orders });
    } catch (error) {
        console.error("Error retrieving user orders:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};