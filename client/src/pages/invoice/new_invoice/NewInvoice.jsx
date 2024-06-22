import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Grid, TextField, IconButton, Button, Typography, Box, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

const InvoiceForm = () => {
  const [customer, setCustomer] = useState({ name: '', address: '', phone: '', gender: '' });
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all products
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setAllProducts(productsData.map(product => ({
        label: product.ItemName,
        unitPrice: product.UnitPrice
      })));
    };
    fetchProducts();
  }, []);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (value, index) => {
    const newProducts = [...products];
    const product = allProducts.find(product => product.label === value);
    const unitPrice = product ? parseFloat(product.unitPrice) : 0;
    newProducts[index] = {
      ...newProducts[index],
      itemName: value,
      unitPrice: unitPrice,
      total: unitPrice * newProducts[index].quantity
    };
    setProducts(newProducts);
    updateTotal(newProducts);
  };

  const handleQuantityChange = (index, event) => {
    const newQuantity = parseInt(event.target.value, 10);
    const newProducts = [...products];
    if (newQuantity > 0) {
      newProducts[index].quantity = newQuantity;
      newProducts[index].total = newQuantity * newProducts[index].unitPrice;
      setProducts(newProducts);
      updateTotal(newProducts);
    }
  };

  const handleAddProduct = () => {
    const newProducts = [...products, { itemName: '', quantity: 1, unitPrice: 0, total: 0 }];
    setProducts(newProducts);
    updateTotal(newProducts);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = products.filter((_, idx) => idx !== index);
    setProducts(newProducts);
    updateTotal(newProducts);
  };

  const updateTotal = (productsList) => {
    const newTotal = productsList.reduce((acc, product) => acc + (product.total), 0);
    setTotal(newTotal);
  };

  const handleSubmit = async () => {
    if (!products.length) {
      alert("Please add at least one product.");
      return;
    }
    await addDoc(collection(db, 'invoices'), {
      customer,
      products,
      total,
      createdAt: new Date()
    });
    alert("Invoice submitted successfully!");
    // Reset the form after submission
    setCustomer({ name: '', address: '', phone: '', gender: '' });
    setProducts([]);
    setTotal(0);
    navigate('/app/invoices');
  };

  return (
    <Box sx={{ maxWidth: 1000, m: 'auto', p: 4 }} >
      <Typography variant="h4" gutterBottom>Invoice Form</Typography>
      {Object.entries(customer).map(([key, value]) => (
        <TextField
          key={key}
          name={key}
          label={key.charAt(0).toUpperCase() + key.slice(1)}
          value={value}
          onChange={handleCustomerChange}
          fullWidth
          margin="normal"
        />
      ))}
      {products.map((product, index) => (
        <Grid container spacing={2} alignItems="center" key={index} flexWrap={'nowrap'} marginTop={'5px'}>
          <Grid item xs={6}>
            <Autocomplete
              value={product.itemName}
              onChange={(event, newValue) => handleItemChange(newValue, index)}
              options={allProducts.map(option => option.label)}
              renderInput={(params) => <TextField {...params} label="Item" />}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              value={product.quantity}
              onChange={(event) => handleQuantityChange(index, event)}
              type="number"
              InputProps={{ inputProps: { min: 1 } }}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              value={`$ ${product.unitPrice.toFixed(2)}`}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              value={`$ ${product.total.toFixed(2)}`}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Grid>
          <Grid item>
            <IconButton onClick={() => handleRemoveProduct(index)} color="error">
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Button
        variant="contained"
        color="primary"
        startIcon={<DeleteIcon />} // Changed to a more appropriate icon for demonstration
        onClick={handleAddProduct}
        sx={{ mt: 2 }}
      >
        Add another item
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 2, ml: 2 }}
      >
        Submit Invoice
      </Button>
      {/* Display Total in the Right Bottom Corner */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          Total: ${total.toFixed(2)}
        </Typography>
      </Box>
    </Box>
  );
};

export default InvoiceForm;
