const express = require('express');
const mysql = require('mysql');
const app = express();

// Direct database connection - tightly coupled
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'ecommerce'
});

// User Management - mixed with business logic
class UserManager {
  async createUser(userData) {
    const query = 'INSERT INTO users SET ?';
    return new Promise((resolve, reject) => {
      db.query(query, userData, (error, results) => {
        if (error) reject(error);
        // Direct email sending from user management
        this.sendWelcomeEmail(userData.email);
        resolve(results);
      });
    });
  }

  async sendWelcomeEmail(email) {
    // Email logic directly in user management
    console.log(`Sending welcome email to ${email}`);
  }
}

// Order Processing - tightly coupled with inventory and payment
class OrderProcessor {
  async createOrder(orderData) {
    // Direct inventory management
    const inventory = await this.checkInventory(orderData.productId);
    if (!inventory.available) {
      throw new Error('Product out of stock');
    }

    // Direct payment processing
    const payment = await this.processPayment(orderData.paymentDetails);
    if (!payment.success) {
      throw new Error('Payment failed');
    }

    // Direct order creation
    const query = 'INSERT INTO orders SET ?';
    return new Promise((resolve, reject) => {
      db.query(query, orderData, (error, results) => {
        if (error) reject(error);
        this.updateInventory(orderData.productId);
        this.sendOrderConfirmation(orderData.email);
        resolve(results);
      });
    });
  }

  async checkInventory(productId) {
    // Direct database queries for inventory
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM inventory WHERE product_id = ?', 
        [productId], 
        (error, results) => {
          if (error) reject(error);
          resolve({ available: results[0].quantity > 0 });
        });
    });
  }

  async processPayment(paymentDetails) {
    // Payment processing logic mixed with order processing
    console.log('Processing payment', paymentDetails);
    return { success: true };
  }

  async updateInventory(productId) {
    // Direct inventory updates
    const query = 'UPDATE inventory SET quantity = quantity - 1 WHERE product_id = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [productId], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }

  async sendOrderConfirmation(email) {
    // Email logic mixed with order processing
    console.log(`Sending order confirmation to ${email}`);
  }
}

// API Routes - all in one place
app.post('/api/users', async (req, res) => {
  try {
    const userManager = new UserManager();
    const result = await userManager.createUser(req.body);
    res.json(result);
    console.log(result)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderProcessor = new OrderProcessor();
    const result = await orderProcessor.createOrder(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3100');
});