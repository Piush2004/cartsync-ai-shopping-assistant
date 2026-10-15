import numpy as np

class JointMapper:
    def map_joints(self, vertices: np.ndarray, J_regressor: np.ndarray) -> np.ndarray:
        """
        Applies regressor matrix to compute joint locations:
        J = J_regressor * vertices
        """
        # J_regressor shape: (24, 6890), vertices shape: (6890, 3)
        return np.dot(J_regressor, vertices)

    def estimate_joints_fallback(self, vertices: np.ndarray) -> np.ndarray:
        """
        Calculates joint locations linearly along height (Dev Mode).
        """
        joints = []
        min_y = float(np.min(vertices[:, 1]))
        max_y = float(np.max(vertices[:, 1]))
        step = (max_y - min_y) / 24.0
        for i in range(24):
            joints.append([0.0, min_y + (i * step), 0.0])
        return np.array(joints)

joint_mapper = JointMapper()
