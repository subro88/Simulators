"""
Unit Tests for WBSCTE Computer Science & Technology 6th Semester Simulation Suite
================================================================================
Validates AdvancedJavaEngine, CompilerDesignEngine, NumericalMethodsEngine,
AdvancedWebTechnologyEngine, DigitalImageProcessingEngine, and CloudCyberSecurityEngine.
"""

import pytest
from app.simulation import (
    AdvancedJavaEngine, AdvancedJavaInput,
    CompilerDesignEngine, CompilerDesignInput,
    NumericalMethodsEngine, NumericalMethodsInput,
    AdvancedWebTechnologyEngine, AdvancedWebTechnologyInput,
    DigitalImageProcessingEngine, DigitalImageProcessingInput,
    CloudCyberSecurityEngine, CloudCyberSecurityInput,
)


def test_advanced_java_jdbc():
    engine = AdvancedJavaEngine()
    inp = AdvancedJavaInput(operation_mode="jdbc_prepared_statement", param_value=75)
    out = engine.calculate(inp)
    assert len(out.returned_records) > 0
    assert "HikariCP" in out.jdbc_connection_pool_status
    assert "JSESSIONID" in out.session_id_cookie


def test_compiler_design_tac():
    engine = CompilerDesignEngine()
    inp = CompilerDesignInput(source_expression="a = b * c + d - e", target_phase="three_address_code")
    out = engine.calculate(inp)
    assert len(out.three_address_code_tac) > 0
    assert len(out.tokens_stream) > 0
    assert len(out.quadruples_table) == 4


def test_numerical_methods_newton():
    engine = NumericalMethodsEngine()
    inp = NumericalMethodsInput(numerical_method="newton_raphson", initial_guess_x0=2.0, iterations_count=4)
    out = engine.calculate(inp)
    assert len(out.iteration_steps) == 4
    assert abs(out.approximate_solution - 2.09455) < 0.01


def test_advanced_web_tech_jwt():
    engine = AdvancedWebTechnologyEngine()
    inp = AdvancedWebTechnologyInput(auth_action="generate_jwt", user_payload_id="student_cst_601")
    out = engine.calculate(inp)
    assert out.token_valid is True
    assert "eyJ" in out.jwt_token_compact
    assert out.decoded_payload["sub"] == "student_cst_601"


def test_digital_image_processing_sobel():
    engine = DigitalImageProcessingEngine()
    inp = DigitalImageProcessingInput(filter_kernel_type="sobel_edge", threshold_value=128)
    out = engine.calculate(inp)
    assert len(out.applied_matrix_kernel) == 3
    assert out.edge_gradient_magnitude > 0.0


def test_cloud_cyber_security_rsa():
    engine = CloudCyberSecurityEngine()
    inp = CloudCyberSecurityInput(security_operation="rsa_asymmetric_crypto", plain_text_message="SECRET_2026")
    out = engine.calculate(inp)
    assert len(out.sha256_hash_digest) == 64
    assert "e=" in out.rsa_public_key_e_n
    assert out.decrypted_plaintext == "SECRET_2026"
