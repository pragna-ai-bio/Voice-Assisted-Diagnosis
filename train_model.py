import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
import pickle
import warnings
warnings.filterwarnings('ignore')

def train_parkinsons_model():
    """
    Train a model for Parkinson's disease detection from voice features
    
    Note: This is a template. Replace with your actual data loading and preprocessing.
    """
    print("Training Parkinson's Disease Detection Model...")
    
    try:
        # TODO: Load your dataset here
        # Example: df = pd.read_csv('parkinsons_voice_data.csv')
        
        # For demonstration, create synthetic data
        print("Creating synthetic data for demonstration...")
        n_samples = 1000
        n_features = 26
        
        # Generate synthetic features similar to real voice data
        np.random.seed(42)
        X = np.random.randn(n_samples, n_features)
        
        # Add patterns that might indicate Parkinson's
        # (Higher jitter, shimmer, lower HNR for positive cases)
        y = np.random.randint(0, 2, n_samples)
        
        # Add some signal to the noise
        X[y == 1, 0] += 0.5  # Higher jitter for Parkinson's
        X[y == 1, 5] += 0.3  # Higher shimmer for Parkinson's
        X[y == 1, 11] -= 5   # Lower HNR for Parkinson's
        
        print(f"Dataset shape: {X.shape}")
        print(f"Class distribution: {pd.Series(y).value_counts().to_dict()}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"Training set: {X_train.shape}")
        print(f"Test set: {X_test.shape}")
        
        # Train Random Forest model
        print("\nTraining Random Forest model...")
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        print("\nModel Evaluation:")
        print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
        print(f"ROC-AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Healthy', 'Parkinson\'s']))
        
        # Feature importance
        feature_names = [
            'jitter_local', 'jitter_abs', 'jitter_rap', 'jitter_ppq5', 'jitter_ddp',
            'shimmer_local', 'shimmer_db', 'shimmer_apq3', 'shimmer_apq5', 'shimmer_apq11', 'shimmer_dda',
            'hnr', 'nth', 'htn',
            'median_pitch', 'mean_pitch', 'std_pitch', 'min_pitch', 'max_pitch',
            'pulses', 'periods', 'mean_period', 'sd_period',
            'fraction_unvoiced', 'num_breaks', 'degree_breaks'
        ]
        
        importances = model.feature_importances_
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        print("\nTop 10 Most Important Features:")
        print(importance_df.head(10).to_string(index=False))
        
        # Save model
        model_path = 'pd_model.pkl'
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        print(f"\nModel saved to: {model_path}")
        
        # Save feature names for reference
        with open('feature_names.pkl', 'wb') as f:
            pickle.dump(feature_names, f)
        
        print("Training completed successfully!")
        
        return model, importance_df
        
    except Exception as e:
        print(f"Error during training: {e}")
        raise

if __name__ == "__main__":
    train_parkinsons_model()
