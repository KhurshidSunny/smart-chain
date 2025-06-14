import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { createProduct, updateProduct } from '../../../services/inventoryService';

const validationSchema = Yup.object({
    name: Yup.string().required('Product name is required'),
    sku: Yup.string().required('SKU is required'),
    stockLevel: Yup.number()
        .min(0, 'Stock level cannot be negative')
        .required('Stock level is required'),
    unitCost: Yup.number()
        .min(0, 'Unit cost cannot be negative')
        .required('Unit cost is required'),
    description: Yup.string(),
});

function ProductForm({ product, onSubmit, onCancel }) {
    const handleSubmit = async (values, { setSubmitting, setError }) => {
        try {
            if (product) {
                await updateProduct(product._id, values);
            } else {
                await createProduct(values);
            }
            onSubmit();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={{
                name: product?.name || '',
                sku: product?.sku || '',
                stockLevel: product?.stockLevel || 0,
                unitCost: product?.unitCost || 0,
                description: product?.description || '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {({ isSubmitting, errors }) => (
                <Form className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Product Name
                        </label>
                        <Field
                            type="text"
                            name="name"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                            SKU
                        </label>
                        <Field
                            type="text"
                            name="sku"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="sku" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="stockLevel" className="block text-sm font-medium text-gray-700">
                            Stock Level
                        </label>
                        <Field
                            type="number"
                            name="stockLevel"
                            min="0"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="stockLevel" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">
                            Unit Cost
                        </label>
                        <Field
                            type="number"
                            name="unitCost"
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="unitCost" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description (Optional)
                        </label>
                        <Field
                            as="textarea"
                            name="description"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    {errors.general && <div className="text-red-500 text-sm">{errors.general}</div>}
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
}

export default ProductForm;